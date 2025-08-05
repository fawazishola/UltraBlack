# Ultra Black Backend API

This is the backend API for the Ultra Black Run Club website, integrating with Notion as a CMS to manage content dynamically. It exposes RESTful endpoints for the frontend to fetch content as JSON, allowing content updates without touching the static HTML/CSS/JS frontend.

## Features
- **Notion Integration**: Fetches content from Notion databases for products, run clubs, wellness events, scholarship details, and static pages.
- **REST API**: Provides endpoints like `/api/products`, `/api/runclubs`, `/api/pages/:slug`, etc.
- **Caching**: Uses Redis (or in-memory fallback) to reduce Notion API calls and improve performance.
- **CORS Support**: Allows the static frontend to access the API from any domain.
- **Error Handling**: Includes rate limit awareness for Notion API.
- **Admin Endpoint**: Force cache refresh with `/api/admin/refresh-cache` (protected with API key).

## Project Structure
- `index.js`: Main server file with Express setup and API endpoints.
- `package.json`: Dependencies and scripts for running and deploying the app.
- `.env.example`: Template for environment variables.
- `utils/notionUtils.js`: Utility functions for Notion data formatting.
- `middleware/auth.js`: Basic authentication for admin endpoints.
- `examples/frontend-integration.js`: Sample code for frontend API integration.

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- Notion account with Integration API key
- Redis (optional, for caching; can be hosted or local)

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd ultra-black-backend
npm install
```

### Step 2: Set Up Notion Integration
1. Go to [Notion Integrations](https://www.notion.so/my-integrations) and create a new integration.
2. Copy the **Internal Integration Token** (this is your `NOTION_API_KEY`).
3. Create databases in Notion for Products, Run Clubs, Wellness, Scholarship, and Pages.
4. Share each database with your integration (via the database share menu).
5. Copy each database ID (from the URL or database properties) for use in environment variables.

**Expected Database Structure**:
Each database should have properties like:
- `Name` (Title)
- `Description` (Rich Text)
- `Images` (Files)
- `Price` (Number, for products)
- `Stock` (Number, for products)
- `Dates` (Date, for events)
- `Tags` (Multi-Select)
- `Slug` (Rich Text, for pages)
- `Status` (Select, e.g., 'Published' or 'Draft')

### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your Notion API key, database IDs, and admin API key:
   ```env
   NOTION_API_KEY=your_notion_api_key_here
   NOTION_PRODUCTS_DB_ID=your_products_database_id_here
   # ... other database IDs
   PORT=3000
   REDIS_URL=redis://localhost:6379
   ADMIN_API_KEY=your_admin_api_key_here
   ```

### Step 4: Run the Server
- **Development Mode** (with auto-restart):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
The server will run on `http://localhost:3000` (or the port specified in `PORT`).

## API Endpoints

| Endpoint                  | Description                          | Example Response Fields                       |
|---------------------------|--------------------------------------|-----------------------------------------------|
| `GET /api/products`       | List all store products             | `id`, `title`, `description`, `images`, `price`, `stock`, `tags` |
| `GET /api/products/:id`   | Get a single product by ID          | Same as above                                 |
| `GET /api/runclubs`       | List run club locations/events      | `id`, `title`, `description`, `images`, `dates`, `tags` |
| `GET /api/wellness`       | List wellness events                | Same as above                                 |
| `GET /api/scholarship`    | List scholarship details            | Same as above                                 |
| `GET /api/pages/:slug`    | Get static page content by slug     | `id`, `title`, `description`, `images`, `slug` |
| `POST /api/admin/refresh-cache` | Force refresh of cache (requires X-API-Key header) | `{ message: 'Cache cleared successfully' }`   |
| `POST /api/applications/submit` | Submit scholarship application     | `{ message: 'Scholarship application submitted successfully', id: '...' }` |

## Frontend Integration
In your static HTML/JS frontend, use `fetch()` to get data. See `examples/frontend-integration.js` for a complete example:
```javascript
fetch('https://your-api-domain.com/api/products')
  .then(response => response.json())
  .then(products => {
    // Render products dynamically
    console.log(products);
  });
```
For form submissions like scholarship applications, see `examples/application-integration.js` for handling form data submission to Notion via the API.

## Deployment Options

### Vercel (Serverless, Recommended)
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```
3. Follow prompts to set up environment variables in Vercel dashboard.

**Note**: The `vercel.json` file is included for serverless configuration.

### Netlify Functions
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Restructure for Netlify Functions (create a `functions` folder and adapt `index.js`).
3. Deploy:
   ```bash
   netlify deploy
   ```

### AWS Lambda
1. Use a tool like `serverless` framework to package for Lambda.
2. Configure environment variables in AWS console.

### Bare Express Server (e.g., DigitalOcean, Heroku)
1. Set up a VPS or PaaS with Node.js.
2. Deploy code and set environment variables.
3. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start index.js
   ```

## Adding New Notion Databases
1. Create a new database in Notion and share it with your integration.
2. Add its ID to `.env` (e.g., `NOTION_NEW_DB_ID=your_new_db_id` or `NOTION_APPLICATIONS_DB_ID` for scholarship submissions).
3. Add a new endpoint in `index.js` or as a separate route file like `routes/applications.js`:
   ```javascript
   app.get('/api/newendpoint', async (req, res) => {
     try {
       const data = await getNotionData(process.env.NOTION_NEW_DB_ID, 'newendpoint');
       res.json(data);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```
4. Restart the server.

## Extending the API
- **Newsletter Signup**: Add a POST endpoint to store emails in a Notion database (see `examples/newsletter-signup.js`).
- **Scholarship Applications**: Already implemented in `routes/applications.js` for storing form submissions to Notion.
- **Donations/Payments**: Integrate Stripe or PayPal with a payment endpoint.
- **Authentication**: Add user login with JWT for admin features.

## Troubleshooting
- **Notion API Errors**: Check if the API key and database IDs are correct, and ensure databases are shared with the integration.
- **Rate Limits**: Notion API has rate limits (~3 requests/second). The cache helps, but for high traffic, consider a more robust database mirror.
- **Redis Connection Issues**: Ensure Redis is running or provide a valid `REDIS_URL`.

## License
MIT Ultra Black Run Club
