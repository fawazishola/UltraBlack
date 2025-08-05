/**
 * Secure route for handling scholarship application submissions to Notion
 * Includes comprehensive validation and rate limiting
 */

const express = require('express');
const { Client } = require('@notionhq/client');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const { applicationValidators } = require('../validators');
const { handleValidationErrors, formLimiter } = require('../middleware/security');

const router = express.Router();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Configure multer for file uploads with security restrictions
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 2 // Maximum 2 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * Helper function to sanitize file names
 */
function sanitizeFileName(fileName) {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Helper function to create Notion properties from application data
 */
function createNotionProperties(data) {
  const {
    firstName,
    lastName,
    dateOfBirth,
    pronouns,
    email,
    phone,
    address,
    city,
    province,
    postalCode,
    gender,
    ethnicBackground,
    institution,
    program,
    graduationYear,
    communityInvolvement,
    personalStatement,
    proofOfEnrollment,
    officialTranscript
  } = data;

  return {
    Name: { 
      title: [{ 
        text: { 
          content: `${firstName} ${lastName}`.substring(0, 200) 
        } 
      }] 
    },
    Email: { 
      email: email 
    },
    Phone: { 
      phone_number: phone || null 
    },
    DateOfBirth: { 
      date: { 
        start: dateOfBirth 
      } 
    },
    Pronouns: { 
      rich_text: [{ 
        text: { 
          content: pronouns || '' 
        } 
      }] 
    },
    Address: { 
      rich_text: [{ 
        text: { 
          content: `${address}, ${city}, ${province} ${postalCode}`.substring(0, 500) 
        } 
      }] 
    },
    Gender: { 
      select: gender ? { name: gender } : null 
    },
    EthnicBackground: { 
      select: ethnicBackground ? { name: ethnicBackground } : null 
    },
    Institution: { 
      rich_text: [{ 
        text: { 
          content: institution.substring(0, 200) 
        } 
      }] 
    },
    Program: { 
      rich_text: [{ 
        text: { 
          content: program.substring(0, 200) 
        } 
      }] 
    },
    GraduationYear: { 
      number: parseInt(graduationYear) 
    },
    CommunityInvolvement: { 
      rich_text: [{ 
        text: { 
          content: communityInvolvement.substring(0, 2000) 
        } 
      }] 
    },
    PersonalStatement: { 
      rich_text: [{ 
        text: { 
          content: personalStatement.substring(0, 2000) 
        } 
      }] 
    },
    ProofOfEnrollment: { 
      files: proofOfEnrollment ? [{ 
        name: proofOfEnrollment.name,
        external: { url: proofOfEnrollment.url }
      }] : [] 
    },
    OfficialTranscript: { 
      files: officialTranscript ? [{ 
        name: officialTranscript.name,
        external: { url: officialTranscript.url }
      }] : [] 
    },
    SubmissionDate: { 
      date: { 
        start: new Date().toISOString() 
      } 
    },
    Status: { 
      select: { 
        name: 'Received' 
      } 
    },
    ApplicationID: { 
      rich_text: [{ 
        text: { 
          content: crypto.randomBytes(8).toString('hex').toUpperCase() 
        } 
      }] 
    }
  };
}

/**
 * POST endpoint to handle scholarship application submissions
 * Includes file upload support and comprehensive validation
 */
router.post('/api/applications/submit',
  formLimiter, // Apply rate limiting
  upload.fields([
    { name: 'proofOfEnrollment', maxCount: 1 },
    { name: 'officialTranscript', maxCount: 1 }
  ]),
  applicationValidators.submit,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      // Process uploaded files
      const files = req.files || {};
      const fileData = {};

      // Handle proof of enrollment
      if (files.proofOfEnrollment && files.proofOfEnrollment[0]) {
        const file = files.proofOfEnrollment[0];
        fileData.proofOfEnrollment = {
          name: sanitizeFileName(file.originalname),
          // In production, you would upload to S3/Cloudinary and get a URL
          // For now, we'll store a placeholder
          url: `https://storage.ultrablack.run/applications/${Date.now()}-${sanitizeFileName(file.originalname)}`
        };
      }

      // Handle official transcript
      if (files.officialTranscript && files.officialTranscript[0]) {
        const file = files.officialTranscript[0];
        fileData.officialTranscript = {
          name: sanitizeFileName(file.originalname),
          url: `https://storage.ultrablack.run/applications/${Date.now()}-${sanitizeFileName(file.originalname)}`
        };
      }

      // Combine form data with file data
      const applicationData = {
        ...req.body,
        ...fileData
      };

      // Create Notion page with application data
      const response = await notion.pages.create({
        parent: { 
          database_id: process.env.NOTION_APPLICATIONS_DB_ID 
        },
        properties: createNotionProperties(applicationData)
      });

      // Send success response
      res.status(201).json({
        success: true,
        message: 'Scholarship application submitted successfully',
        applicationId: response.id,
        submittedAt: new Date().toISOString(),
        nextSteps: 'You will receive a confirmation email within 24 hours. The review process typically takes 2-4 weeks.'
      });

      // TODO: Send confirmation email to applicant
      // TODO: Send notification to admin

    } catch (error) {
      console.error('Error handling scholarship application:', error);
      
      // Handle specific Notion API errors
      if (error.code === 'database_not_found') {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Application system is temporarily unavailable. Please try again later.'
        });
      }
      
      if (error.code === 'rate_limited') {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Application system is experiencing high volume. Please try again in a few minutes.'
        });
      }

      // Handle multer errors
      if (error.message && error.message.includes('File too large')) {
        return res.status(400).json({
          error: 'File Too Large',
          message: 'File size must not exceed 5MB'
        });
      }

      if (error.message && error.message.includes('Only PDF files')) {
        return res.status(400).json({
          error: 'Invalid File Type',
          message: 'Only PDF files are accepted for document uploads'
        });
      }

      // Generic error response
      next(error);
    }
  }
);

/**
 * GET endpoint to check application status (requires application ID and email)
 */
router.get('/api/applications/status',
  async (req, res, next) => {
    try {
      const { applicationId, email } = req.query;

      if (!applicationId || !email) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Application ID and email are required'
        });
      }

      // Query Notion for the application
      const response = await notion.databases.query({
        database_id: process.env.NOTION_APPLICATIONS_DB_ID,
        filter: {
          and: [
            {
              property: 'ApplicationID',
              rich_text: {
                equals: applicationId.toUpperCase()
              }
            },
            {
              property: 'Email',
              email: {
                equals: email.toLowerCase()
              }
            }
          ]
        }
      });

      if (response.results.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No application found with the provided details'
        });
      }

      const application = response.results[0];
      const status = application.properties.Status?.select?.name || 'Unknown';
      const submissionDate = application.properties.SubmissionDate?.date?.start;

      res.json({
        applicationId,
        status,
        submissionDate,
        lastUpdated: application.last_edited_time
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
