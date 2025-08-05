import { Router } from 'express';
import { getNotionData } from '../../utils/notionUtils';

const router = Router();

// Notion database ID for homepage content
const HOMEPAGE_CONTENT_DB_ID = process.env.NOTION_HOMEPAGE_CONTENT_DB_ID;

/**
 * @route   GET /api/homepage-content
 * @desc    Get all homepage content (images, captions, etc.)
 * @access  Public
 */
router.get('/homepage-content', async (req, res, next) => {
  try {
    if (!HOMEPAGE_CONTENT_DB_ID) {
      throw new Error('Homepage content database ID not configured');
    }
    const data = await getNotionData(HOMEPAGE_CONTENT_DB_ID, 'homepage_content');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;