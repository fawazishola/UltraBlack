document.addEventListener('DOMContentLoaded', function () {
    const citySelector = document.getElementById('city-selector');
    const cityDetailsContainer = document.getElementById('city-details-container');

    let runClubsData = [];

    // Fetch Run Clubs data from the API
    async function fetchRunClubs() {
        try {
            const response = await fetch('http://localhost:3000/api/run-clubs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            runClubsData = await response.json();
            populateCitySelector();
        } catch (error) {
            console.error("Could not fetch run clubs data:", error);
            cityDetailsContainer.innerHTML = '<p class="text-center text-red-500">Failed to load run club data. Please try again later.</p>';
        }
    }

    // Populate the city selector dropdown
    function populateCitySelector() {
        citySelector.innerHTML = '<option value="">Choose your city...</option>'; // Clear existing options
        runClubsData.forEach(club => {
            const option = document.createElement('option');
            option.value = club.id;
            option.textContent = club.title;
            citySelector.appendChild(option);
        });
    }

    // Render the details for the selected city
    function renderCityDetails(cityId) {
        const club = runClubsData.find(c => c.id === cityId);
        if (!club) return;

        // Clear previous details
        cityDetailsContainer.innerHTML = '';

        const detailsHTML = `
            <div class="city-details bg-gray-900 rounded-lg p-8 md:p-12 container mx-auto px-6">
                <h2 class="text-5xl font-black mb-2">${club.title}</h2>
                <p class="text-xl text-gray-400 mb-8">${club.description || ''}</p>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2">
                        <h3 class="text-2xl font-bold mb-4">Upcoming Runs</h3>
                        <div class="space-y-3 whitespace-pre-line">${club.meetingInfo || 'Details coming soon.'}</div>
                        <h3 class="text-2xl font-bold mt-8 mb-4">Local Leaders</h3>
                        <p>${club.leaders || 'Community Led'}</p>
                    </div>
                    <div class="relative w-full h-64 md:h-full rounded-lg overflow-hidden group">
                        <iframe src="${club.mapUrl || ''}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" class="pointer-events-none"></iframe>
                        <a href="${club.mapUrl || '#'}" target="_blank" rel="noopener noreferrer" class="absolute inset-0 z-10" aria-label="Open location in Google Maps"></a>
                    </div>
                </div>
            </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = detailsHTML;
        const newDetails = tempDiv.firstElementChild;
        cityDetailsContainer.appendChild(newDetails);

        // Animate the new details into view
        gsap.fromTo(newDetails, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
    }

    // Event listener for city selection
    citySelector.addEventListener('change', (e) => {
        const selectedCityId = e.target.value;
        if (selectedCityId) {
            renderCityDetails(selectedCityId);
        } else {
            cityDetailsContainer.innerHTML = ''; // Clear details if no city is selected
        }
    });

    // Initial fetch
    fetchRunClubs();
});
