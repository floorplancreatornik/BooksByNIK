const script = (() => {

    const APP_SCREENS = [
        'home', 'cart', 'profile', 'book-details', 'checkout', 'thank-you' 
    ];
    let currentBookId = null;
    let currentScreenId = 'home';
    let finalOrderId = ''; 

    // --- Login Logic ---
    const checkLogin = () => {
        i18n.init(); 
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'home.html';
        } else {
             // 'login' screen display is only possible in index.html, not home.html
             // This line should ideally not run in home.html
             if (document.getElementById('login-screen')) {
                 document.getElementById('login-screen').style.display = 'flex';
             }
        }
    };

    const login = () => {
        const name = document.getElementById('login-name').value.trim();
        const phone = document.getElementById('login-phone').value.trim();

        if (name === "" || phone.length !== 10 || isNaN(phone)) {
            alert(i18n.getKey('loginValidation'));
            return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', name);
        localStorage.setItem('userPhone', phone);

        window.location.href = 'home.html';
    };

    // --- Core Navigation and Initialization (Used in home.html) ---
    const showScreen = (screenId) => {
        const bottomNav = document.getElementById('main-bottom-nav');
        const bottomActionsBar = document.querySelector('.bottom-actions-bar');

        APP_SCREENS.forEach(id => {
            const screen = document.getElementById(id + '-screen');
            if (screen) screen.style.display = 'none';
        });

        const targetScreen = document.getElementById(screenId + '-screen');
        if (targetScreen) targetScreen.style.display = 'flex';
        currentScreenId = screenId;

        const isMainScreen = ['home', 'cart', 'profile'].includes(screenId);

        if (bottomNav) bottomNav.style.display = isMainScreen ? 'flex' : 'none'; 
        if (bottomActionsBar) bottomActionsBar.style.display = screenId === 'book-details' ? 'flex' : 'none';

        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        if (isMainScreen) {
            const targetNav = document.querySelector(`.nav-item[data-target="${screenId}"]`);
            if (targetNav) targetNav.classList.add('active');
        }

        if (screenId === 'home') renderBookList();
        if (screenId === 'cart') cart.renderCart();
        if (screenId === 'profile') renderProfile();
        if (screenId === 'checkout') renderCheckout();
        if (screenId === 'thank-you') renderThankYou();

        // FIX: Re-run i18n initialization on screen change (THIS IS THE LANGUAGE FIX)
        i18n.init();
    };

    const init = () => {
        i18n.init(); 

        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }

        // This is primarily for home.html onload call
        updateCartBadge();
    };

    const renderBookList = () => {
        const bookListContainer = document.getElementById('book-list');
        // FIX for empty list: Ensure API is returning data
        const bookData = api.getBookData(); 
        
        // CRITICAL DEBUG STEP: Check the console (F12) for this output!
        console.log('Book Data received:', bookData); 

        if (bookData && bookData.length > 0) {
             bookListContainer.innerHTML = bookData.map(book => {
                return `
                    <div class="book-card" onclick="script.showBookDetails('${book.id}')">
                        <img src="${book.image}" alt="${book.title}" class="book-cover">
                        <span class="price-tag">₹${book.price}</span>
                        <div class="book-details">
                            <div class="book-title-ml">${book.title}</div>
                            <div class="book-author">${i18n.getKey('author')}: ${book.author}</div>
                            <div class="book-category">${i18n.getKey('category')}: ${book.category}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // Optional: Show a message if no books are loaded
            bookListContainer.innerHTML = '<p style="text-align: center; color: #999;">Book list is currently empty or failed to load. Check console (F12) for details.</p>';
        }
    };

    const showBookDetails = (id) => {
        currentBookId = id; 
        const book = api.getBookData().find(b => b.id === id);
        const detailsContent = document.querySelector('.book-details-content');
        if (!book) return;

        // FIX: Ensure description is translated based on the current language
        const description = i18n.currentLanguage === 'en' ? book.description_en : book.description;

        detailsContent.innerHTML = `
            <img src="${book.image}" alt="${book.title} Cover" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
            <h3 style="margin-top: 15px;">${book.title}</h3>
            <p>${i18n.getKey('author')}: ${book.author}</p>
            <p>${i18n.getKey('category')}: ${book.category}</p>
            <p style="font-size: 1.5em; font-weight: bold; color: var(--primary-color);">${i18n.getKey('price')}: ₹${book.price}</p>
            <p style="margin-top: 15px;">${description}</p>
        `;
        showScreen('book-details');
    };

    // --- Checkout Logic (UPI UX IMPROVEMENT) ---
    const processPayment = async () => {
        const name = document.getElementById('order-name').value.trim(); 
        const phone = document.getElementById('order-phone').value.trim(); 
        const address = document.getElementById('address').value.trim();
        const pincode = document.getElementById('pincode').value.trim();
        const total = cart.calculateTotal();
        let isValid = true;

        const payButton = document.getElementById('checkout-btn');
        const payBtnText = document.getElementById('pay-btn-text');
        const originalText = payBtnText.innerText; 

        // 1. Validation 
        if (name === "" || phone.length !== 10 || isNaN(phone) || address.length < 10 || pincode.length !== 6 || isNaN(pincode)) {
             alert(i18n.getKey('checkoutValidation'));
             isValid = false;
        }

        if (isValid) {

            // UX FIX: Disable button and show loading/redirecting text to prevent double-click
            payButton.disabled = true;
            payBtnText.innerText = "Redirecting to UPI App..."; 

            try {

                // 2. Gather Data for UPI Note & Sheet Logging
                const bookCodes = cart.getCartItems().map(item => item.id).join('+'); 

                // 3. API submission (Writes to Google Sheet)
                const orderData = {
                    items: cart.getCartItems(),
                    total: total,
                    shipping: { address, pincode },
                    user: { name, phone } 
                };
                const result = await api.submitOrder(orderData);

                // 4. Generate UPI link with Custom Note
                const customNote = `${bookCodes}|${pincode}|${phone}|${name.replace(/ /g, '_')}`; 
                const upiLink = api.generateUpiLink(total, customNote);

                // 5. Update Order ID and clear cart
                finalOrderId = result.orderId;
                localStorage.removeItem('cart');
                cart.cartItems = [];
                updateCartBadge();

                // 6. REDIRECT TO UPI APP 
                window.location.href = upiLink; 

            } catch (error) {
                alert("Payment processing failed. Please try again.");
                console.error(error);
                // Re-enable button on error
                payButton.disabled = false;
                payBtnText.innerText = originalText;
            }
        }
    };

    // --- Remaining Utility Functions ---
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    };

    const updateCartBadge = () => {
        const totalItems = cart.getCartItems().reduce((sum, item) => sum + item.quantity, 0);
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.innerText = totalItems;
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    };

    const renderProfile = () => {
        const profileContent = document.querySelector('#profile-screen .profile-content');
        const name = localStorage.getItem('userName') || 'User';
        const phone = localStorage.getItem('userPhone') || 'N/A';

        profileContent.innerHTML = `
            <div class="info-section" style="text-align: left;">
                <p><strong>${i18n.getKey('loginNameLabel')}:</strong> ${name}</p>
                <p><strong>${i18n.getKey('loginPhoneLabel')}:</strong> +91 ${phone}</p>
                <p style="margin-top: 15px; color: #7f8c8d;">${i18n.getKey('profileNote')}</p>
            </div>
            <button class="continue-button ml" onclick="script.logout()">${i18n.getKey('logoutBtn')}</button>
        `;
    };

    const logout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('cart');
        window.location.href = 'index.html';
    };

    const renderCheckout = () => {
        const total = cart.calculateTotal();
        const summaryItems = document.getElementById('summary-items');
        const totalAmountSpan = document.getElementById('total-amount');
        const payBtnText = document.getElementById('pay-btn-text');

        const storedName = localStorage.getItem('userName') || '';
        const storedPhone = localStorage.getItem('userPhone') || '';

        document.getElementById('order-name').value = storedName;
        document.getElementById('order-phone').value = storedPhone;

        let summaryHTML = '';
        if (cart.getCartItems().length === 0) {
            showScreen('home'); 
            return;
        } 
        cart.getCartItems().forEach(item => {
            const itemTotal = item.price * item.quantity;
            summaryHTML += `
                <div class="summary-line">
                    <span>${item.title} (x${item.quantity})</span>
                    <span>₹${itemTotal}</span>
                </div>
            `;
        });
        summaryItems.innerHTML = summaryHTML;
        totalAmountSpan.innerText = `₹${total}`;
        payBtnText.innerText = `${i18n.getKey('payBtnText').replace('₹0', `₹${total}`)}`;
    };

    const renderThankYou = () => {
        document.getElementById('order-paid-amount').innerText = `₹${cart.calculateTotal()}`;
        document.getElementById('order-id-label').nextElementSibling.innerText = finalOrderId;
    }

    const getCurrentBookId = () => currentBookId;
    const getCurrentScreenId = () => currentScreenId;

    // Call init for home.html (loaded via home.html's onload attribute)
    if (document.URL.includes('home.html')) {
        document.addEventListener('DOMContentLoaded', init);
    }

    return {
        login,
        checkLogin,
        showScreen,
        toggleDarkMode,
        updateCartBadge,
        showBookDetails,
        processPayment,
        logout,
        getCurrentBookId,
        getCurrentScreenId,
    };
})();