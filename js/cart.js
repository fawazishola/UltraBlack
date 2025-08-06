/**
 * =================================================================
 * Global Cart Management for Ultra Black Run Club
 * =================================================================
 * This script provides global functions to manage the shopping cart
 * using localStorage. It ensures cart data is consistent across all pages.
 */

/**
 * Retrieves the cart from localStorage.
 * @returns {Array<object>} The array of cart items.
 */
function getCart() {
    try {
        const cartJson = localStorage.getItem('cart');
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        // If parsing fails, return an empty cart to prevent site breakage
        return [];
    }
}

/**
 * Saves the cart to localStorage.
 * @param {Array<object>} cart - The array of cart items to save.
 */
function setCart(cart) {
    try {
        const cartJson = JSON.stringify(cart);
        localStorage.setItem('cart', cartJson);
    } catch (error) {
        console.error("Error saving cart to localStorage:", error);
    }
}

/**
 * Updates the cart count display on all relevant elements.
 */
function updateCartCount() {
    const cart = getCart();
    // Calculate total quantity of items, not just the number of unique items
    const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    
    // Find all elements that display the cart count
    const cartCountElements = document.querySelectorAll('#cart-count, #cart-count-mobile');
    
    cartCountElements.forEach(el => {
        el.textContent = count;
        // Optionally show/hide the count bubble if it's zero
        if (count > 0) {
            el.style.display = 'flex'; // Use flex for the centering styles
        } else {
            el.style.display = 'none';
        }
    });
}

/**
 * Adds an item to the shopping cart.
 * @param {object} item - The item to add. Must include id, name, price, image.
 */
function addItemToCart(item) {
    if (!item || !item.id || !item.name || typeof item.price !== 'number' || !item.image) {
        console.error("Attempted to add an invalid item to cart:", item);
        return;
    }

    const cart = getCart();
    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Add new item with a quantity of 1
        cart.push({ ...item, quantity: 1 });
    }

    setCart(cart);
    updateCartCount(); // Update UI immediately
}

// Initial update of the cart count when the script loads on any page.
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});