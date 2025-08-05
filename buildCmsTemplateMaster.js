// buildCmsTemplateMaster.js
// Automates creation of a single master Notion page with multiple embedded databases

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// 1) Create parent "CMS Master" page
tasync function createParentPage() {
  const res = await notion.pages.create({
    parent: { type: 'workspace' },
    properties: {
      title: [{ text: { content: 'CMS‑Managed Assets Master' } }]
    }
  });
  return res.id;
}

// 2) Create a database under the parent page
tasync function createDatabase(parentPageId, title, properties) {
  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ type: 'text', text: { content: title } }],
    properties
  });
  return db.id;
}

// 3) Append blocks to embed each database onto the parent page
tasync function embedDatabase(parentPageId, heading, dbId) {
  await notion.blocks.children.append({
    block_id: parentPageId,
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { text: [{ type: 'text', text: { content: heading } }] }
      },
      {
        object: 'block',
        type: 'child_database',
        child_database: { database_id: dbId }
      }
    ]
  });
}

(async () => {
  try {
    const parentId = await createParentPage();

    // Master CMS assets DB
    const assetsDbId = await createDatabase(parentId, 'CMS‑Managed Assets', {
      Page: { type: 'select', select: { options: ['Home','About','Store','Donation','Fitness','Wellness','Run Clubs','Scholarship','Application'].map(n=>({name:n})) } },
      Section: { type: 'select', select: { options: ['Hero','Featured','Gallery','CTA','Footer','Team','Products','Events'].map(n=>({name:n})) } },
      'Field Name': { type: 'title', title: {} },
      'Field Type': { type: 'select', select: { options: ['Text','URL','Image','Rich Text','Form Endpoint'].map(n=>({name:n})) } },
      Value: { type: 'rich_text', rich_text: {} },
      Notes: { type: 'rich_text', rich_text: {} }
    });

    // Optional supporting DBs
    const productsDbId = await createDatabase(parentId, 'Products', {
      Name: { type: 'title', title: {} },
      Price: { type: 'number', number: { format: 'usd' } },
      Image: { type: 'url', url: {} },
      Category: { type: 'select', select: { options: ['hoodie','tee','headwear'].map(n=>({name:n})) } }
    });

    const eventsDbId = await createDatabase(parentId, 'Events', {
      Date: { type: 'date', date: {} },
      Title: { type: 'rich_text', rich_text: {} },
      Time: { type: 'rich_text', rich_text: {} },
      Location: { type: 'rich_text', rich_text: {} },
      Description: { type: 'rich_text', rich_text: {} }
    });

    const teamDbId = await createDatabase(parentId, 'Team Members', {
      Name: { type: 'title', title: {} },
      Title: { type: 'rich_text', rich_text: {} },
      Photo: { type: 'url', url: {} },
      Bio: { type: 'rich_text', rich_text: {} }
    });

    // Embed all DBs on the master page
    await embedDatabase(parentId, '📦 CMS‑Managed Assets', assetsDbId);
    await embedDatabase(parentId, '🛍️ Products Library', productsDbId);
    await embedDatabase(parentId, '📅 Events Calendar', eventsDbId);
    await embedDatabase(parentId, '👥 Team Members', teamDbId);

    console.log('✅ Master CMS page created with all databases under page ID:', parentId);
  } catch (err) {
    console.error('Error building Notion template:', err);
  }
})();
