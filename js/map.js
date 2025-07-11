class RunClubMap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.defaultOptions = {
      zoom: 12,
      center: { lat: 43.6532, lng: -79.3832 }, // Default to Toronto
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };
    
    this.options = { ...this.defaultOptions, ...options };
    this.markers = [];
    this.map = null;
    
    this.init();
  }
  
  async init() {
    this.container.classList.add('loading');
    
    try {
      // Load Google Maps API
      await this.loadGoogleMaps();
      
      // Initialize the map
      this.map = new google.maps.Map(this.container, {
        zoom: this.options.zoom,
        center: this.options.center,
        styles: this.options.styles,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      });
      
      // Add markers if locations are provided
      if (this.options.locations && this.options.locations.length > 0) {
        this.addMarkers(this.options.locations);
      }
      
      // Add click event to close info windows
      this.map.addListener('click', () => {
        this.closeAllInfoWindows();
      });
      
    } catch (error) {
      console.error('Error loading map:', error);
      this.container.innerHTML = `
        <div class="map-error">
          <p>Unable to load the map. Please check your internet connection and try again.</p>
          <button class="retry-btn">Retry</button>
        </div>
      `;
      
      const retryBtn = this.container.querySelector('.retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.init());
      }
    } finally {
      this.container.classList.remove('loading');
    }
  }
  
  loadGoogleMaps() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your API key
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = resolve;
      script.onerror = reject;
      
      document.head.appendChild(script);
    });
  }
  
  addMarkers(locations) {
    if (!this.map) return;
    
    // Clear existing markers
    this.clearMarkers();
    
    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();
    
    locations.forEach(location => {
      const { lat, lng, title, address, schedule, contact } = location;
      const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
      
      // Extend bounds to include this position
      bounds.extend(position);
      
      // Create marker
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#000000" stroke="#ffffff" stroke-width="2"/>
              <circle cx="16" cy="16" r="4" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 16)
        }
      });
      
      // Create info window content
      const content = `
        <div class="map-info-window">
          <h3>${title}</h3>
          ${address ? `<p class="address">${address}</p>` : ''}
          ${schedule ? `<p class="schedule">${schedule}</p>` : ''}
          ${contact ? `<p class="contact">${contact}</p>` : ''}
        </div>
      `;
      
      const infoWindow = new google.maps.InfoWindow({
        content,
        maxWidth: 300
      });
      
      // Add click event to marker
      marker.addListener('click', () => {
        this.closeAllInfoWindows();
        infoWindow.open(this.map, marker);
      });
      
      this.markers.push({ marker, infoWindow });
    });
    
    // Fit map to bounds with padding
    if (locations.length > 1) {
      this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else if (locations.length === 1) {
      this.map.setCenter(bounds.getCenter());
      this.map.setZoom(14); // Zoom in more for single location
    }
  }
  
  closeAllInfoWindows() {
    this.markers.forEach(({ infoWindow }) => {
      infoWindow.close();
    });
  }
  
  clearMarkers() {
    this.markers.forEach(({ marker, infoWindow }) => {
      marker.setMap(null);
      infoWindow.close();
    });
    this.markers = [];
  }
  
  // Public method to update locations
  updateLocations(locations) {
    this.addMarkers(locations);
  }
}

// Example usage:
// const runClubMap = new RunClubMap('map-container', {
//   locations: [
//     {
//       lat: 43.6532,
//       lng: -79.3832,
//       title: 'Downtown Run Club',
//       address: '123 Main St, Toronto, ON',
//       schedule: 'Every Wednesday at 6:30 PM',
//       contact: 'contact@ultrablack.run'
//     },
//     // Add more locations...
//   ]
// });
