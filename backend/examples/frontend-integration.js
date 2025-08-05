/*
 * Example script for integrating Ultra Black static frontend with backend API
 * Place this in your HTML files or as a separate JS file to fetch and render content dynamically
 */

// Base URL for your deployed API (update this after deployment)
const API_BASE_URL = 'https://your-api-domain.com'; // Replace with Vercel URL or local server (e.g., http://localhost:3000)

/**
 * Fetch and render products for store.html
 */
async function renderProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();

    const container = document.querySelector('#products-container');
    if (!container) return; // Ensure container exists in DOM

    container.innerHTML = ''; // Clear existing content
    products.forEach(product => {
      if (product.status === 'Published') { // Only show published items
        const productCard = `
          <div class="product-card text-white p-6 flex flex-col items-center">
            <img src="${product.images[0] || 'placeholder.jpg'}" alt="${product.title}" class="w-full h-48 object-cover mb-4 rounded-md">
            <h3 class="text-xl font-bold mb-2">${product.title}</h3>
            <p class="text-gray-400 mb-4">$${product.price.toFixed(2)}</p>
            <button class="premium-button bg-white text-black px-4 py-2 rounded-full" onclick="addToCart('${product.id}')">
              ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        `;
        container.innerHTML += productCard;
      }
    });
  } catch (error) {
    console.error('Error rendering products:', error);
    document.querySelector('#products-container').innerHTML = '<p class="text-red-400">Failed to load products. Please try again later.</p>';
  }
}

/**
 * Fetch and render page content dynamically (e.g., About page)
 * @param {string} slug - Unique slug for the page
 */
async function renderPage(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch page content');
    const page = await response.json();

    const titleElement = document.querySelector('#page-title');
    const contentElement = document.querySelector('#page-content');
    if (titleElement && contentElement) {
      titleElement.textContent = page.title || 'Untitled Page';
      contentElement.innerHTML = page.description || '<p>No content available.</p>';
      if (page.images.length > 0) {
        contentElement.innerHTML += `<img src="${page.images[0]}" alt="${page.title}" class="w-full mt-4 rounded-md">`;
      }
    }
  } catch (error) {
    console.error('Error rendering page:', error);
    document.querySelector('#page-content').innerHTML = '<p class="text-red-400">Failed to load content. Please try again later.</p>';
  }
}

/**
 * Fetch and render events (wellness or run clubs)
 * @param {string} type - 'wellness' or 'runclubs'
 */
async function renderEvents(type) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/${type}`);
    if (!response.ok) throw new Error(`Failed to fetch ${type}`);
    const events = await response.json();

    const container = document.querySelector(`#${type}-container`);
    if (!container) return;

    container.innerHTML = '';
    events.forEach(event => {
      if (event.status === 'Published') {
        const eventCard = `
          <div class="event-card text-white p-4 rounded-lg bg-gray-900">
            <h3 class="text-lg font-bold mb-2">${event.title}</h3>
            <p class="text-gray-400">${event.dates.start || 'Date TBD'}</p>
            <p class="mt-2">${event.description.slice(0, 100)}...</p>
          </div>
        `;
        container.innerHTML += eventCard;
      }
    });
  } catch (error) {
    console.error(`Error rendering ${type}:`, error);
    document.querySelector(`#${type}-container`).innerHTML = `<p class="text-red-400">Failed to load ${type}. Please try again later.</p>`;
  }
}

/**
 * Example: Add to cart function (integrate with existing localStorage logic)
 * @param {string} productId - ID of the product to add
 */
function addToCart(productId) {
  // Fetch product details if needed, or use ID to store in cart
  console.log(`Adding product ${productId} to cart`);
  // Integrate with your existing cart logic from localStorage
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount(); // Call existing function if available
  alert('Added to cart!');
}

/**
 * Initialize content rendering based on page
 * Call this on DOMContentLoaded in your HTML
 */
function initPage() {
  const path = window.location.pathname.split('/').pop().replace('.html', '');
  
  if (path === 'store') {
    renderProducts();
  } else if (path === 'wellness') {
    renderEvents('wellness');
  } else if (path === 'runclubs') {
    renderEvents('runclubs');
  } else if (path === 'about' || path === 'scholarship') {
    renderPage(path);
  }
}

// Add event listener to initialize rendering when the DOM is ready
document.addEventListener('DOMContentLoaded', initPage);

// Export for testing or module usage if needed
if (typeof module !== 'undefined') {
  module.exports = { renderProducts, renderPage, renderEvents, initPage };
}
