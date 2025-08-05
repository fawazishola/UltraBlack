/*
 * Example script for integrating scholarship application form submission with the Ultra Black backend API
 * Add this to your frontend HTML/JS to submit form data to Notion via the backend
 */

/**
 * Handle submission of scholarship application form
 * @param {Event} event - Form submission event
 */
async function handleApplicationSubmit(event) {
  event.preventDefault();
  
  // Replace with your deployed API domain or use relative path if on same domain
  const API_BASE_URL = 'https://your-api-domain.com'; // Update this after deployment
  
  // Extract form data
  const form = event.target;
  const formData = {
    name: form.querySelector('#name').value,
    email: form.querySelector('#email').value,
    phone: form.querySelector('#phone').value,
    address: form.querySelector('#address').value,
    essay: form.querySelector('#essay').value,
    documents: form.querySelector('#documents').value // This could be a URL or text field
  };

  try {
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    // Send data to backend
    const response = await fetch(`${API_BASE_URL}/api/applications/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Submission failed');
    }

    const result = await response.json();
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.color = 'green';
    successDiv.style.padding = '10px';
    successDiv.style.marginTop = '10px';
    successDiv.textContent = result.message;
    form.parentNode.insertBefore(successDiv, form.nextSibling);
    
    form.reset(); // Clear form
  } catch (error) {
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '10px';
    errorDiv.style.marginTop = '10px';
    errorDiv.textContent = `Error: ${error.message}`;
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    console.error('Application submission error:', error);
  } finally {
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Application';
  }
}

// Example of attaching the handler to your form in application.html
/*
// Add this to your <script> section or separate JS file
document.addEventListener('DOMContentLoaded', () => {
  const applicationForm = document.querySelector('#application-form');
  if (applicationForm) {
    applicationForm.addEventListener('submit', handleApplicationSubmit);
  }
});
*/

// Example HTML form structure for application.html
/*
<form id="application-form">
  <div>
    <label for="name">Full Name:</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div>
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div>
    <label for="phone">Phone:</label>
    <input type="tel" id="phone" name="phone">
  </div>
  <div>
    <label for="address">Address:</label>
    <textarea id="address" name="address"></textarea>
  </div>
  <div>
    <label for="essay">Essay (Why you deserve this scholarship):</label>
    <textarea id="essay" name="essay" required rows="5"></textarea>
  </div>
  <div>
    <label for="documents">Supporting Documents (link or description):</label>
    <input type="text" id="documents" name="documents">
  </div>
  <button type="submit">Submit Application</button>
</form>
*/
