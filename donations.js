document.addEventListener('DOMContentLoaded', () => {
    const donationOptions = document.querySelectorAll('.donation-option');
    const customAmountInput = document.getElementById('custom-amount');
    const donateButton = document.getElementById('donate-button');

    let selectedAmount = null;

    donationOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected style from all options
            donationOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected style to the clicked option
            option.classList.add('selected');
            // Store the selected amount
            selectedAmount = option.dataset.amount;
            // Clear custom amount input
            if (customAmountInput) {
                customAmountInput.value = '';
            }
        });
    });

    if (customAmountInput) {
        customAmountInput.addEventListener('input', () => {
            // When user types a custom amount, deselect the predefined options
            donationOptions.forEach(opt => opt.classList.remove('selected'));
            selectedAmount = null;
        });
    }

    if (donateButton) {
        donateButton.addEventListener('click', () => {
            const customAmount = customAmountInput ? customAmountInput.value : null;
            const finalAmount = customAmount || selectedAmount;

            if (finalAmount && parseFloat(finalAmount) > 0) {
                // Redirect to a checkout page, passing the amount as a URL parameter
                window.location.href = `cart.html?item=Donation&price=${finalAmount}`;
            } else {
                alert('Please select a donation amount or enter a custom amount.');
            }
        });
    }
});
