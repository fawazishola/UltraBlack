// Form Validation
class FormValidator {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (!this.form) return;
    
    this.fields = this.form.querySelectorAll('[required]');
    this.submitButton = this.form.querySelector('button[type="submit"]');
    
    this.init();
  }

  init() {
    // Add event listeners
    this.fields.forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.clearError(field));
    });

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  validateField(field) {
    const value = field.value.trim();
    const errorElement = field.nextElementSibling?.classList?.contains('form-error') 
      ? field.nextElementSibling 
      : null;

    if (field.required && !value) {
      this.setError(field, 'This field is required', errorElement);
      return false;
    }

    if (field.type === 'email' && !this.isValidEmail(value)) {
      this.setError(field, 'Please enter a valid email address', errorElement);
      return false;
    }

    if (field.type === 'tel' && !this.isValidPhone(value)) {
      this.setError(field, 'Please enter a valid phone number', errorElement);
      return false;
    }

    if (field.dataset.minLength && value.length < parseInt(field.dataset.minLength)) {
      this.setError(field, `Must be at least ${field.dataset.minLength} characters`, errorElement);
      return false;
    }

    this.clearError(field, errorElement);
    return true;
  }

  setError(field, message, errorElement) {
    field.classList.add('error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearError(field, errorElement) {
    field.classList.remove('error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone) {
    return /^[\d\s\-()]+$/.test(phone);
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    let isValid = true;
    this.fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    if (isValid) {
      this.setLoading(true);
      
      try {
        // Replace with actual form submission logic
        await this.submitForm(new FormData(this.form));
        this.showSuccess();
      } catch (error) {
        this.showError('An error occurred. Please try again.');
      } finally {
        this.setLoading(false);
      }
    }
  }

  setLoading(isLoading) {
    if (this.submitButton) {
      this.submitButton.disabled = isLoading;
      this.submitButton.classList.toggle('button--loading', isLoading);
    }
  }

  showSuccess() {
    // Implement success message display
    alert('Form submitted successfully!');
    this.form.reset();
  }

  showError(message) {
    // Implement error message display
    alert(message);
  }

  async submitForm(formData) {
    // Replace with your actual form submission logic
    console.log('Form data:', Object.fromEntries(formData));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  }
}

// Initialize form validation
if (document.querySelector('form')) {
  document.querySelectorAll('form').forEach((form, index) => {
    new FormValidator(`form${form.id ? `#${form.id}` : ''}`);
  });
}

// Lazy loading images
document.addEventListener('DOMContentLoaded', () => {
  // Add skip to main content link if not present
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.prepend(skipLink);
  }

  // Lazy load images with Intersection Observer
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('lazy-load');
          img.onload = () => {
            img.classList.add('loaded');
          };
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.classList.add('lazy-load', 'loaded');
    });
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Update URL without jumping
      if (history.pushState) {
        history.pushState(null, null, targetId);
      } else {
        location.hash = targetId;
      }
    }
  });
});
