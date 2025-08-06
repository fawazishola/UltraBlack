document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/homepage-content';

    const elementMapping = {
      'Hero': 'hero-image-container',
      'Who We Are': 'who-we-are-image-container',
      'What We Do': 'what-we-do-image-container',
      'Gallery': 'gallery-container'
    };

    // ugcMapping is no longer needed, as we will generate gallery items dynamically.

    async function fetchHomepageContent() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        return data.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
      } catch (error) {
        console.error('Error fetching homepage content:', error);
        return [];
      }
    }

    function renderImages(content) {
      console.log('Rendering content:', content);
      let ugcIndex = 0;

      content.forEach(item => {
        console.log('Processing item:', item);
        const containerId = elementMapping[item.type];

        if (!containerId) {
          console.warn(`No container mapping for type: ${item.type}`);
          return;
        }

        // Handle Gallery items by dynamically creating them
        if (item.type === 'Gallery') {
            const galleryContainer = document.getElementById(containerId);
            if (galleryContainer && item.images && item.images.length > 0) {
                // Clear any existing placeholders
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
                    console.log(`Rendered gallery image into #${containerId}`);
                });
            }
        } else { // Handle Hero, Who We Are, What We Do
          const container = document.getElementById(containerId);
          if (container) {
            if (item.images && item.images.length > 0) {
              container.innerHTML = ''; // Clear for all types
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
              console.log(`Rendered ${item.type} image into #${containerId}`);
            }
          } else {
            console.warn(`Container not found for type ${item.type}: #${containerId}`);
          }
        }
      });

      // No longer need to fill placeholder UGC slots. The gallery is now dynamic.
    }

    fetchHomepageContent().then(renderImages);
});