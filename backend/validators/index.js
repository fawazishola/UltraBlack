/**
 * Input validation schemas for all API endpoints
 * Uses express-validator for comprehensive validation
 */

const { body, param, query, check } = require('express-validator');

// Common validation rules
const commonValidators = {
  email: body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  phone: body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .isLength({ min: 10, max: 20 })
    .withMessage('Please provide a valid phone number'),
  
  name: (field) => body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min: 2, max: 100 })
    .withMessage(`${field} must be between 2 and 100 characters`)
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage(`${field} contains invalid characters`),
  
  text: (field, minLength = 1, maxLength = 1000) => body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
    .escape(), // Escape HTML to prevent XSS
  
  mongoId: (field) => param(field)
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  slug: param('slug')
    .trim()
    .notEmpty()
    .matches(/^[a-z0-9\-]+$/)
    .withMessage('Invalid slug format')
};

// Product validators
const productValidators = {
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .trim()
      .isIn(['hoodie', 'tee', 'headwear', 'accessories'])
      .withMessage('Invalid category')
  ],
  
  getById: [
    commonValidators.mongoId('id')
  ]
};

// Scholarship application validators
const applicationValidators = {
  submit: [
    // Personal Information
    commonValidators.name('firstName'),
    commonValidators.name('lastName'),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Please provide a valid date')
      .custom((value) => {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 16 || age > 100) {
          throw new Error('Applicant must be between 16 and 100 years old');
        }
        return true;
      }),
    body('pronouns')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .escape(),
    
    // Contact Information
    commonValidators.email,
    commonValidators.phone,
    body('address')
      .trim()
      .notEmpty()
      .withMessage('Address is required')
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be between 10 and 200 characters')
      .escape(),
    body('city')
      .trim()
      .notEmpty()
      .withMessage('City is required')
      .matches(/^[a-zA-Z\s\-]+$/)
      .withMessage('City contains invalid characters'),
    body('province')
      .trim()
      .notEmpty()
      .isIn(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'])
      .withMessage('Please select a valid Canadian province'),
    body('postalCode')
      .trim()
      .matches(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/)
      .withMessage('Please provide a valid Canadian postal code'),
    
    // Academic Information
    body('institution')
      .trim()
      .notEmpty()
      .withMessage('Institution is required')
      .isLength({ min: 3, max: 200 })
      .escape(),
    body('program')
      .trim()
      .notEmpty()
      .withMessage('Program of study is required')
      .isLength({ min: 3, max: 200 })
      .escape(),
    body('graduationYear')
      .isInt({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 })
      .withMessage('Please provide a valid graduation year'),
    
    // Essays
    commonValidators.text('communityInvolvement', 50, 500),
    commonValidators.text('personalStatement', 50, 500),
    
    // Files (validated separately in middleware)
    body('proofOfEnrollment')
      .optional()
      .isString(),
    body('officialTranscript')
      .optional()
      .isString()
  ]
};

// Newsletter validators
const newsletterValidators = {
  subscribe: [
    commonValidators.email,
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .escape(),
    body('consent')
      .isBoolean()
      .equals('true')
      .withMessage('You must consent to receive newsletters')
  ],
  
  unsubscribe: [
    commonValidators.email
  ]
};

// Contact form validators
const contactValidators = {
  submit: [
    commonValidators.name('name'),
    commonValidators.email,
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ min: 5, max: 200 })
      .escape(),
    commonValidators.text('message', 10, 2000),
    body('category')
      .optional()
      .isIn(['general', 'partnership', 'sponsorship', 'technical', 'other'])
      .withMessage('Invalid category')
  ]
};

// Order validators
const orderValidators = {
  create: [
    commonValidators.email,
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.productId')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 10 })
      .withMessage('Quantity must be between 1 and 10'),
    body('shippingAddress')
      .isObject()
      .withMessage('Shipping address is required'),
    body('shippingAddress.street')
      .trim()
      .notEmpty()
      .isLength({ max: 200 })
      .escape(),
    body('shippingAddress.city')
      .trim()
      .notEmpty()
      .matches(/^[a-zA-Z\s\-]+$/),
    body('shippingAddress.province')
      .trim()
      .notEmpty()
      .isIn(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']),
    body('shippingAddress.postalCode')
      .trim()
      .matches(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/),
    body('paymentIntentId')
      .trim()
      .notEmpty()
      .matches(/^pi_[a-zA-Z0-9]+$/)
      .withMessage('Invalid payment intent ID')
  ]
};

// Admin validators
const adminValidators = {
  updateProduct: [
    commonValidators.mongoId('id'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .escape(),
    body('price')
      .optional()
      .isFloat({ min: 0, max: 10000 })
      .withMessage('Price must be between 0 and 10000'),
    body('stock')
      .optional()
      .isInt({ min: 0, max: 9999 })
      .withMessage('Stock must be between 0 and 9999'),
    body('status')
      .optional()
      .isIn(['Published', 'Draft', 'Archived'])
      .withMessage('Invalid status')
  ]
};

module.exports = {
  productValidators,
  applicationValidators,
  newsletterValidators,
  contactValidators,
  orderValidators,
  adminValidators,
  commonValidators
};