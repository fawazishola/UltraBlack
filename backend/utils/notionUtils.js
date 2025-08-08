/*
 * Utility functions for interacting with Notion API
 */

/**
 * Safely extract text content from Notion rich text or title properties
 * @param {Object} property - Notion property object
 * @returns {string} - Extracted text or empty string if not available
 */
function getTextFromProperty(property) {
  try {
    if (property?.title) {
      return property.title[0]?.text?.content || '';
    } else if (property?.rich_text) {
      return property.rich_text[0]?.text?.content || '';
    }
    return '';
  } catch (error) {
    console.error('Error extracting text from property:', error);
    return '';
  }
}

/**
 * Extract file URLs from Notion files property
 * @param {Object} property - Notion files property
 * @returns {Array<string>} - Array of file URLs
 */
function getFilesFromProperty(property) {
  try {
    return property?.files?.map(file => file.file?.url || file.external?.url || '')?.filter(url => url) || [];
  } catch (error) {
    console.error('Error extracting files from property:', error);
    return [];
  }
}

/**
 * Format a Notion page object into a standardized JSON structure
 * @param {Object} page - Raw Notion page object
 * @returns {Object} - Formatted data object
 */
function formatNotionPage(page) {
  try {
    const props = page.properties;
    const formattedPage = {
      id: page.id || '',
      title: getTextFromProperty(props.Name),
      description: getTextFromProperty(props.Description),
      images: getFilesFromProperty(props.Images || props.Image),
      price: props.Price?.number,
      stock: props.Stock?.number,
      dates: props.Dates?.date,
      tags: props.Tags?.multi_select?.map(tag => tag.name) || [],
      slug: getTextFromProperty(props.Slug),
      lastEdited: page.last_edited_time || '',
      status: props.Status?.select?.name || 'Draft',
      caption: getTextFromProperty(props.Caption),
      type: props.Type?.select?.name,
      // Run Club specific fields
      meetingInfo: getTextFromProperty(props['Meeting Info']),
      leaders: getTextFromProperty(props.Leaders),
      mapUrl: props['Map URL']?.url,
    };

    if (props['Display Order'] && props['Display Order'].number !== null) {
      formattedPage.displayOrder = props['Display Order'].number;
    }
    
    // Clean up null/undefined properties to avoid sending them in JSON
    Object.keys(formattedPage).forEach(key => {
      if (formattedPage[key] === undefined || formattedPage[key] === null) {
        delete formattedPage[key];
      }
    });

    return formattedPage;
  } catch (error) {
    console.error(`Error formatting page ${page.id}:`, error);
    return { id: page.id || 'unknown', error: 'Failed to format page data' };
  }
}

/**
 * Check if the error is related to Notion API rate limiting
 * @param {Object} error - Error object from Notion API call
 * @returns {boolean} - True if rate limit error
 */
function isRateLimitError(error) {
  return error.status === 429 || error.code === 'rate_limit_exceeded';
}

module.exports = {
  formatNotionPage,
  isRateLimitError
};
