import { updateCartCount } from './cart.f78a7330.js';

const API_URL = 'http://localhost:3000/api/homepage-content';

const elementMapping = {
  'Hero': 'hero-image-container',
  'Who We Are': 'who-we-are-image-container',
  'What We Do': 'what-we-do-image-container',
  'Gallery': 'gallery-container'
};

async function fetchHomepageContent() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return [];
  }
}

function renderImages(content) {
  content.forEach(item => {
    const containerId = elementMapping[item.type];
    if (!containerId) {
      return;
    }

    if (item.type === 'Gallery') {
      const galleryContainer = document.getElementById(containerId);
      if (galleryContainer && item.images && item.images.length > 0) {
        galleryContainer.innerHTML = '';
        item.images.forEach(imageUrl => {
          const galleryItem = document.createElement('div');
          galleryItem.className = 'city-tile relative h-96 rounded-lg overflow-hidden group';
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = item.caption || item.title || 'Gallery image';
          img.className = 'absolute w-full h-full object-cover transition-transform duration-500 group-hover:scale-110';
          galleryItem.appendChild(img);
          galleryContainer.appendChild(galleryItem);
        });
      }
    } else {
      const container = document.getElementById(containerId);
      if (container && item.images && item.images.length > 0) {
        container.innerHTML = '';
        if (item.type === 'Hero') {
          container.style.backgroundImage = `url('${item.images[0]}')`;
          container.style.backgroundSize = 'cover';
          container.style.backgroundPosition = 'center';
        } else {
          const img = document.createElement('img');
          img.src = item.images[0];
          img.alt = item.caption || item.title || item.type;
          img.className = 'absolute w-full h-full object-cover transition-transform duration-500 group-hover:scale-110';
          container.appendChild(img);
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  updateCartCount();

  const animatedText = document.getElementById('animated-text');
  const textContent = 'We run together. We move the culture.';
  if (animatedText) {
    const words = textContent.split(' ');
    animatedText.innerHTML = words.map(word => `<span class="inline-block opacity-0">${word}</span>`).join(' ');
    const spans = Array.from(animatedText.querySelectorAll('span'));
    spans.forEach((span, idx) => {
      setTimeout(() => {
        span.classList.remove('opacity-0');
        span.classList.add('opacity-100', 'transition-opacity', 'duration-700');
      }, idx * 150);
    });
  }

  window.addEventListener('scroll', () => {
    const heroBg = document.querySelector('.hero-bg');
    const scrollY = window.scrollY;
    if (heroBg) {
      heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
    }
  });

  fetchHomepageContent().then(renderImages);
});
