$files = Get-ChildItem -Path "c:\Users\olato\Downloads\Ultrablack" -Filter "*.html" -File | Where-Object { $_.Name -ne "index.html" }

$navContent = @"
<nav id="navbar" class="glossy-header fixed top-0 left-0 right-0 z-50">
    <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="/UltraBlack/index.html" class="text-2xl font-black tracking-wider">ULTRA BLACK</a>
        
        <!-- Desktop Menu -->
        <div class="hidden lg:flex items-center space-x-8">
            <a href="/UltraBlack/run-clubs.html" class="hover:text-white transition-colors">Run Clubs</a>
            <a href="/UltraBlack/fitness.html" class="hover:text-white transition-colors">Fitness</a>
            <a href="/UltraBlack/wellness.html" class="hover:text-white transition-colors">Wellness</a>
            <a href="/UltraBlack/About.html" class="hover:text-white transition-colors">About</a>
            <a href="/UltraBlack/store.html" class="hover:text-white transition-colors">Store</a>
            <a href="/UltraBlack/donations.html" class="hover:text-white transition-colors">Donations</a>
            <a href="/UltraBlack/scholarship.html" class="hover:text-white transition-colors">Scholarship</a>
        </div>

        <div class="hidden lg:flex items-center space-x-6">
            <a href="/UltraBlack/cart.html" class="relative text-white hover:text-gray-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span id="cart-count" class="absolute -top-2 -right-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">0</span>
            </a>
            <a href="#" class="bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-transform transform hover:scale-105">
                Join the Movement
            </a>
        </div>

        <!-- Mobile Menu Button -->
        <button id="mobile-menu-button" class="lg:hidden flex items-center p-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
    </div>
</nav>

<!-- Mobile Menu -->
<div id="mobile-menu" class="hidden lg:hidden fixed inset-0 bg-black/95 z-40 pt-24">
    <div class="container mx-auto px-6 flex flex-col items-center text-center space-y-6">
        <a href="/UltraBlack/run-clubs.html" class="text-2xl hover:text-white transition-colors">Run Clubs</a>
        <a href="/UltraBlack/fitness.html" class="text-2xl hover:text-white transition-colors">Fitness</a>
        <a href="/UltraBlack/wellness.html" class="text-2xl hover:text-white transition-colors">Wellness</a>
        <a href="/UltraBlack/about.html" class="text-2xl hover:text-white transition-colors">About</a>
        <a href="/UltraBlack/store.html" class="text-2xl hover:text-white transition-colors">Store</a>
        <a href="/UltraBlack/donations.html" class="text-2xl hover:text-white transition-colors">Donations</a>
        <a href="/UltraBlack/scholarship.html" class="text-2xl hover:text-white transition-colors">Scholarship</a>
        <a href="/UltraBlack/cart.html" class="text-2xl hover:text-white transition-colors flex items-center justify-center mt-4">
            <span>Cart</span>
            <span id="mobile-cart-count" class="ml-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">0</span>
        </a>
        <a href="#" class="mt-4 bg-white text-black font-bold py-4 px-8 rounded-full hover:bg-gray-200 transition-transform transform hover:scale-105">Join the Movement</a>
    </div>
</div>
"@

$jsContent = @"
// Update cart count function
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    document.querySelectorAll('#cart-count, #mobile-cart-count').forEach(el => {
        el.textContent = totalItems || '0';
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart count
    updateCartCount();
"@

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Update navigation
    $content = $content -replace '(?s)<nav id="navbar".*?<\/nav>', $navContent
    
    # Update mobile menu if it exists
    $content = $content -replace '(?s)<div id="mobile-menu".*?<\/div>', ''
    
    # Add mobile menu after nav if not exists
    if ($content -notmatch 'id="mobile-menu"') {
        $content = $content -replace '(?s)<\/nav>', "</nav>`n$navContent"
    }
    
    # Add cart count JS if not exists
    if ($content -notmatch 'function updateCartCount') {
        $content = $content -replace '(?s)document\.addEventListener\(\'DOMContentLoaded\'', $jsContent
    }
    
    # Save the updated content
    $content | Set-Content -Path $file.FullName -Encoding UTF8
    
    Write-Host "Updated $($file.Name)"
}

Write-Host "Navigation updated on all pages."
