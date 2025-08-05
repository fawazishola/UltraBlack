# Ultra Black Run Club API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://api.ultrablack.run`

## Authentication
Most endpoints are public. Admin endpoints require an API key in the `X-API-Key` header.

## Rate Limiting
- General endpoints: 100 requests per 15 minutes per IP
- Form submissions: 10 requests per hour per IP
- Auth endpoints: 5 requests per 15 minutes per IP

## Response Format
All responses are in JSON format with the following structure:

### Success Response
```json
{
  "data": { ... },
  "pagination": { ... } // Optional, for list endpoints
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [ ... ] // Optional, validation errors
}
```

## Endpoints

### Products

#### List Products
```
GET /api/products
```

Query Parameters:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `category` (string, optional): Filter by category (hoodie, tee, headwear, accessories)

Response:
```json
{
  "data": [
    {
      "id": "product_id",
      "title": "Culture Hoodie",
      "description": "Premium quality hoodie",
      "images": ["url1", "url2"],
      "price": 85.00,
      "stock": 50,
      "tags": ["hoodie", "featured"],
      "status": "Published"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Product by ID
```
GET /api/products/:id
```

Response:
```json
{
  "id": "product_id",
  "title": "Culture Hoodie",
  "description": "Premium quality hoodie",
  "images": ["url1", "url2"],
  "price": 85.00,
  "stock": 50,
  "tags": ["hoodie", "featured"],
  "status": "Published"
}
```

### Run Clubs

#### List Run Clubs
```
GET /api/runclubs
```

Response:
```json
[
  {
    "id": "club_id",
    "title": "Toronto Chapter",
    "description": "Weekly runs in downtown Toronto",
    "images": ["url1"],
    "dates": {
      "start": "2025-01-01",
      "end": null
    },
    "tags": ["toronto", "weekly"],
    "status": "Published"
  }
]
```

### Wellness Events

#### List Wellness Events
```
GET /api/wellness
```

Response:
```json
[
  {
    "id": "event_id",
    "title": "Mindfulness Workshop",
    "description": "Monthly wellness workshop",
    "images": ["url1"],
    "dates": {
      "start": "2025-02-15T10:00:00Z",
      "end": "2025-02-15T12:00:00Z"
    },
    "tags": ["workshop", "mindfulness"],
    "status": "Published"
  }
]
```

### Scholarship

#### Get Scholarship Information
```
GET /api/scholarship
```

Response:
```json
[
  {
    "id": "scholarship_id",
    "title": "Ultra Black Annual Scholarship",
    "description": "Supporting Black students in athletics",
    "images": ["url1"],
    "dates": {
      "start": "2025-01-01",
      "end": "2025-03-31"
    },
    "tags": ["2025", "open"],
    "status": "Published"
  }
]
```

### Static Pages

#### Get Page by Slug
```
GET /api/pages/:slug
```

Parameters:
- `slug`: Page identifier (e.g., "about", "terms", "privacy")

Response:
```json
{
  "id": "page_id",
  "title": "About Us",
  "description": "Full page content in HTML",
  "images": ["url1"],
  "slug": "about",
  "lastEdited": "2025-01-27T10:00:00Z",
  "status": "Published"
}
```

### Applications

#### Submit Scholarship Application
```
POST /api/applications/submit
```

Headers:
- `Content-Type`: `multipart/form-data` (for file uploads)

Rate Limit: 10 submissions per hour per IP

Request Body:
```
firstName: string (required, 2-100 chars)
lastName: string (required, 2-100 chars)
dateOfBirth: string (required, ISO 8601 date)
pronouns: string (optional, max 50 chars)
email: string (required, valid email)
phone: string (optional, 10-20 chars)
address: string (required, 10-200 chars)
city: string (required)
province: string (required, Canadian province code)
postalCode: string (required, Canadian postal code)
gender: string (optional)
ethnicBackground: string (optional)
institution: string (required, 3-200 chars)
program: string (required, 3-200 chars)
graduationYear: number (required, current year or future)
communityInvolvement: string (required, 50-500 chars)
personalStatement: string (required, 50-500 chars)
proofOfEnrollment: file (optional, PDF, max 5MB)
officialTranscript: file (optional, PDF, max 5MB)
```

Response:
```json
{
  "success": true,
  "message": "Scholarship application submitted successfully",
  "applicationId": "app_id",
  "submittedAt": "2025-01-27T10:00:00Z",
  "nextSteps": "You will receive a confirmation email within 24 hours."
}
```

#### Check Application Status
```
GET /api/applications/status
```

Query Parameters:
- `applicationId`: Application ID from submission
- `email`: Email used in application

Response:
```json
{
  "applicationId": "APP123456",
  "status": "Under Review",
  "submissionDate": "2025-01-27T10:00:00Z",
  "lastUpdated": "2025-01-28T15:00:00Z"
}
```

### Admin Endpoints

#### Refresh Cache
```
POST /api/admin/refresh-cache
```

Headers:
- `X-API-Key`: Admin API key (required)

Response:
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2025-01-27T10:00:00Z"
}
```

## Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Validation Error Format
```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

## CORS Policy
The API supports CORS for configured origins. In production, only approved domains are allowed.

## Best Practices

1. **Always handle errors**: Check for error responses and handle them gracefully
2. **Respect rate limits**: Implement exponential backoff for retries
3. **Cache responses**: Cache GET requests on the client side when appropriate
4. **Validate input**: Validate data client-side before sending to reduce errors
5. **Use HTTPS**: Always use HTTPS in production

## Example Integration

### JavaScript/Fetch
```javascript
const API_BASE = 'https://api.ultrablack.run';

// Get products
async function getProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Submit application
async function submitApplication(formData) {
  try {
    const response = await fetch(`${API_BASE}/api/applications/submit`, {
      method: 'POST',
      body: formData // FormData object with files
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Submission failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
}
```

## Support

For API support or to report issues:
- Email: api-support@ultrablack.run
- GitHub: https://github.com/ultrablack/api-issues