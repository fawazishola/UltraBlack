const { Client } = require('@notionhq/client');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { formatNotionPage } = require('./notionUtils');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const CACHE_DIR = path.resolve(__dirname, '../cache');
const HOMEPAGE_CACHE_FILE = path.resolve(CACHE_DIR, 'homepage.json');
const IMAGES_DIR = path.resolve(__dirname, '../../public/images/homepage');
const PUBLIC_IMAGE_PATH = '/public/images/homepage';

async function downloadImage(url, filepath) {
    try {
        const writer = (await fs.open(filepath, 'w')).createWriteStream();
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image from ${url}:`, error);
        return null;
    }
}

async function updateHomepageCache() {
    console.log('Starting homepage cache update...');
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.mkdir(IMAGES_DIR, { recursive: true });

        const response = await notion.databases.query({
            database_id: process.env.NOTION_HOMEPAGE_CONTENT_DB_ID,
        });

        const formattedData = response.results.map(page => formatNotionPage(page));

        for (const item of formattedData) {
            if (item.images && item.images.length > 0) {
                const newImageUrls = [];
                for (const imageUrl of item.images) {
                    if(imageUrl) {
                        const imageName = path.basename(new URL(imageUrl).pathname);
                        const localImagePath = path.join(IMAGES_DIR, imageName);
                        await downloadImage(imageUrl, localImagePath);
                        newImageUrls.push(`${PUBLIC_IMAGE_PATH}/${imageName}`);
                    }
                }
                item.images = newImageUrls;
            }
        }

        await fs.writeFile(HOMEPAGE_CACHE_FILE, JSON.stringify(formattedData, null, 2));
        console.log('Homepage cache updated successfully.');

    } catch (error) {
        console.error('Failed to update homepage cache:', error);
    }
}

module.exports = { updateHomepageCache };
