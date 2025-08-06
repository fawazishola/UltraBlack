/**
 * Global cart management utilities
 */

export function getCart() {
  try {
    const cartJson = localStorage.getItem('cart');
    return cartJson ? JSON.parse(cartJson) : [];
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    return [];
  }
}

export function setCart(cart) {
  try {
    const cartJson = JSON.stringify(cart);
    localStorage.setItem('cart', cartJson);
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

export function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
  const cartCountElements = document.querySelectorAll('#cart-count, #cart-count-mobile');
  cartCountElements.forEach(el => {
    el.textContent = count;
    if (count > 0) {
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  });
}

export function addItemToCart(item) {
  if (!item || !item.id || !item.name || typeof item.price !== 'number' || !item.image) {
    console.error('Attempted to add an invalid item to cart:', item);
    return;
  }

  const cart = getCart();
  const existingItem = cart.find(cartItem => cartItem.id === item.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  setCart(cart);
  updateCartCount();
}

if (typeof window !== 'undefined') {
  window.updateCartCount = updateCartCount;
  window.addItemToCart = addItemToCart;
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
