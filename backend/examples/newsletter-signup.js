/*
 * Example script for adding a newsletter signup endpoint to the Ultra Black backend
 * This can be added to index.js or as a separate route file
 */

const express = require('express');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const router = express.Router();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * POST endpoint to handle newsletter signups and store them in a Notion database
 */
router.post('/api/newsletter/signup', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Create a new page in the Notion newsletter database
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_NEWSLETTER_DB_ID },
      properties: {
        Email: { rich_text: [{ text: { content: email } }] },
        SignupDate: { date: { start: new Date().toISOString() } }
      }
    });

    res.status(201).json({ message: 'Successfully signed up for newsletter', id: response.id });
  } catch (error) {
    console.error('Error handling newsletter signup:', error);
    res.status(500).json({ error: 'Failed to process signup' });
  }
});

// Example frontend code to call this endpoint (add to your HTML/JS)
/*
async function signupNewsletter(email) {
  try {
    const response = await fetch('https://your-api-domain.com/api/newsletter/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Signup failed');
    const data = await response.json();
    alert(data.message);
  } catch (error) {
    console.error('Error signing up:', error);
    alert('Failed to sign up. Please try again.');
  }
}
*/

module.exports = router;
