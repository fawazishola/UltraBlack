const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const { Client } = require('@notionhq/client');
const redis = require('redis');
const cron = require('node-cron');
const fs = require('fs').promises;
require('dotenv').config();

// Import security middleware and validators
const { 
  basicSecurity, 
  generalLimiter, 
  formLimiter,
  validateApiKey,
  handleValidationErrors 
} = require('./middleware/security');
const { 
  productValidators,
  applicationValidators,
  commonValidators 
} = require('./validators');
const { formatNotionPage, isRateLimitError } = require('./utils/notionUtils');
const { updateHomepageCache } = require('./utils/update-homepage-cache');
const { adminAuth, verifyToken } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

// Environment validation
const requiredEnvVars = [
  'NOTION_API_KEY',
  'NOTION_PRODUCTS_DB_ID',
  'NOTION_RUNCLUBS_DB_ID',
  'NOTION_WELLNESS_DB_ID',
  'NOTION_SCHOLARSHIP_DB_ID',
  'NOTION_PAGES_DB_ID',
  'ADMIN_API_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// Apply security middleware first
app.use(basicSecurity);

// Configure CORS properly
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:5000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Apply general rate limiting to all routes
app.use('/api/', generalLimiter);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files from the project root (for HTML, etc.)
app.use(express.static(path.join(__dirname, '../')));
// Serve the public directory for cached images
app.use('/public', express.static(path.join(__dirname, '../public'), {
  maxAge: '30d',
  immutable: true,
  etag: true
}));

// API root: return basic info (avoid serving missing index.html in serverless)
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Ultra Black API',
    health: '/health',
    homepageContent: '/api/homepage-content'
  });
});

// Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Redis Client with error handling
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  // Don't exit the process, just log the error
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    // Continue without Redis (will just hit Notion API directly)
  }
})();

// Cache duration in seconds (1 hour)
const CACHE_DURATION = 60;

// Helper function to get data from Notion with caching
async function getNotionData(databaseId, cacheKey, filters = {}) {
  try {
    // Check if Redis is connected
    if (redisClient.isOpen) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return JSON.parse(cachedData);
        }
      } catch (cacheError) {
        console.error('Cache read error:', cacheError);
        // Continue to fetch from Notion
      }
    }

    // Fetch from Notion with pagination support
    const allResults = [];
    let hasMore = true;
    let startCursor;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: 100, // Max page size
        ...filters
      });

      allResults.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    const formattedData = allResults.map(formatNotionPage);

    // Cache the result if Redis is connected
    if (redisClient.isOpen) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(formattedData), {
          EX: CACHE_DURATION
        });
      } catch (cacheError) {
        console.error('Cache write error:', cacheError);
      }
    }

    return formattedData;
  } catch (error) {
    console.error(`Error fetching data from Notion DB ${databaseId}:`, error);
    // Check for rate limit error
    if (isRateLimitError(error)) {
      throw new Error('Notion API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch data from Notion: ${error.message}`);
  }
}

// API Routes

// Products endpoints with validation
app.get('/api/products', 
  productValidators.list,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, category } = req.query;
      const data = await getNotionData(process.env.NOTION_PRODUCTS_DB_ID, 'products');
      
      // Filter by category if provided
      let filteredData = data;
      if (category) {
        filteredData = data.filter(product => 
          product.tags && product.tags.includes(category)
        );
      }
      
      // Implement pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      res.json({
        data: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get('/api/products/:id',
  productValidators.getById,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const data = await getNotionData(process.env.NOTION_PRODUCTS_DB_ID, 'products');
      const product = data.find(p => p.id === req.params.id);
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ 
          error: 'Not Found',
          message: 'Product not found' 
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Run Clubs
app.get('/api/runclubs', async (req, res, next) => {
  try {
    const data = await getNotionData(process.env.NOTION_RUNCLUBS_DB_ID, 'runclubs');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Wellness Events
app.get('/api/wellness', async (req, res, next) => {
  try {
    const data = await getNotionData(process.env.NOTION_WELLNESS_DB_ID, 'wellness');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Scholarship Details
app.get('/api/scholarship', async (req, res, next) => {
  try {
    const data = await getNotionData(process.env.NOTION_SCHOLARSHIP_DB_ID, 'scholarship');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Homepage Content (from local cache)
const HOMEPAGE_CACHE_FILE = path.resolve(__dirname, './cache/homepage.json');
app.get('/api/homepage-content', async (req, res, next) => {
  try {
    const data = await fs.readFile(HOMEPAGE_CACHE_FILE, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(data);
  } catch (error) {
    // If cache file doesn't exist, trigger an update and ask client to retry.
    if (error.code === 'ENOENT') {
      console.log('Homepage cache not found. Triggering update...');
      updateHomepageCache(); // Run it now
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Homepage content is currently being updated. Please try again in a moment.'
      });
    }
    next(error);
  }
});

// Static Pages with slug validation
app.get('/api/pages/:slug',
  commonValidators.slug,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const data = await getNotionData(process.env.NOTION_PAGES_DB_ID, 'pages');
      const page = data.find(p => p.slug === req.params.slug);
      if (page) {
        res.json(page);
      } else {
        res.status(404).json({ 
          error: 'Not Found',
          message: 'Page not found' 
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Admin endpoint to force cache refresh (protected with better auth)
app.post('/api/admin/refresh-cache', 
  validateApiKey,
  async (req, res, next) => {
    try {
      if (redisClient.isOpen) {
        await redisClient.flushAll();
        res.json({ 
          success: true,
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({ 
          error: 'Service Unavailable',
          message: 'Cache service is not available' 
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

app.post('/api/admin/refresh-homepage', 
  validateApiKey,
  async (req, res, next) => {
    try {
      await updateHomepageCache();
      res.json({ 
        success: true,
        message: 'Homepage cache refreshed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);
// Cron endpoint for Vercel Cron (GET) with light auth
app.get('/api/internal/cron/refresh-homepage', async (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const isVercelCron = req.headers['x-vercel-cron'] === '1' || /vercel-cron/i.test(userAgent);
    const token = req.query.token || req.headers['x-cron-token'];
    const envToken = process.env.HOMEPAGE_CRON_TOKEN;

    if (!isVercelCron && (!envToken || token !== envToken)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid cron authorization' });
    }

    await updateHomepageCache();
    res.json({ success: true, message: 'Homepage cache refreshed (cron)', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

// Scholarship Applications route with rate limiting
app.use('/api/applications', formLimiter);
const applicationsRouter = require('./routes/applications');
app.use('/', applicationsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log error details (but not to the client)
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  let statusCode = err.statusCode || 500;
  let message = 'Internal Server Error';
  
  // Handle specific error types
  if (err.message.includes('CORS')) {
    statusCode = 403;
    message = 'Cross-origin request blocked';
  } else if (err.message.includes('rate limit')) {
    statusCode = 429;
    message = err.message;
  } else if (err.message.includes('Validation')) {
    statusCode = 400;
    message = err.message;
  } else if (err.message.includes('Unauthorized')) {
    statusCode = 401;
    message = 'Authentication required';
  } else if (err.message.includes('Forbidden')) {
    statusCode = 403;
    message = 'Access denied';
  }

  // Send error response
  res.status(statusCode).json({
    error: statusCode < 500 ? message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close Redis connection
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(port, async () => {
  // Run the cache update once on startup
  console.log('Performing initial homepage cache update on server start...');
  await updateHomepageCache();

  // Daily at 03:00 (override with HOMEPAGE_CACHE_CRON)
  const CRON_SCHEDULE = process.env.HOMEPAGE_CACHE_CRON || '0 3 * * *';
  console.log(`Scheduling homepage cache update with cron: ${CRON_SCHEDULE}`);
  cron.schedule(CRON_SCHEDULE, () => {
    console.log('Running scheduled homepage cache update...');
    updateHomepageCache();
  }, { scheduled: true, timezone: "America/New_York" });

  console.log(`Ultra Black API server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS origins: ${process.env.ALLOWED_ORIGINS || 'localhost only'}`);
});

module.exports = app;
