const script = (() => {
    const APP_SCREENS = [
        'login', 'home', 'cart', 'profile', 'book-details', 'checkout', 'thank-you'
    ];
    let currentBookId = null;
    let currentScreenId = 'login';
    let finalOrderId = ''; 

    // --- Core Navigation and Initialization ---

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
    };

    const init = () => {
        i18n.init(); 
        
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
        
        if (localStorage.getItem('isLoggedIn') === 'true') {
            showScreen('home');
        } else {
            showScreen('login');
        }
        
        updateCartBadge();
    };

    const validateAndRedirect = () => {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (name === "" || phone.length !== 10 || isNaN(phone)) {
            alert(i18n.getKey('loginValidation'));
            return;
        }

        localStorage.setItem('userName', name);
        localStorage.setItem('userPhone', phone);
        localStorage.setItem('isLoggedIn', 'true');

        showScreen('home');
    };

    const renderBookList = () => {
        const bookListContainer = document.getElementById('book-list');
        bookListContainer.innerHTML = api.getBookData().map(book => {
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
    };

    const showBookDetails = (id) => {
        currentBookId = id; 
        const book = api.getBookData().find(b => b.id === id);
        const detailsContent = document.querySelector('.book-details-content');
        if (!book) return;
        
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

    // --- Checkout Logic (Revised for UPI Note) ---

    const processPayment = async () => {
        const address = document.getElementById('address').value.trim();
        const pincode = document.getElementById('pincode').value.trim();
        const total = cart.calculateTotal();
        let isValid = true;
        
        // 1. Validation
        if (address.length < 10 || pincode.length !== 6 || isNaN(pincode)) {
             alert(i18n.getKey('checkoutValidation'));
             isValid = false;
        }

        if (isValid) {
            
            // 2. Gather Data for UPI Note & Sheet Logging
            const name = localStorage.getItem('userName') || 'N/A';
            const phone = localStorage.getItem('userPhone') || 'N/A';
            const bookCodes = cart.getCartItems().map(item => item.id).join('+'); // e.g., WOH001+ADVE002

            // 3. API submission (Writes to Google Sheet)
            const orderData = {
                items: cart.getCartItems(),
                total: total,
                shipping: { address, pincode }
            };
            const result = await api.submitOrder(orderData);
            
            // 4. Generate UPI link with Custom Note
            
            // Custom UPI Note Format: bookcode|pincode|phonenumber|full name with spaces
            const customNote = `${bookCodes}|${pincode}|${phone}|${name.replace(/ /g, '_')}`; 
            
            const upiLink = api.generateUpiLink(total, customNote);

            window.open(upiLink, '_blank'); // Open UPI app

            // 5. Update Thank You Screen and clear cart
            finalOrderId = result.orderId;
            
            localStorage.removeItem('cart');
            cart.cartItems = [];
            updateCartBadge();
            
            showScreen('thank-you');
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
        showScreen('login');
    };

    const renderCheckout = () => {
        const total = cart.calculateTotal();
        const summaryItems = document.getElementById('summary-items');
        const totalAmountSpan = document.getElementById('total-amount');
        const payBtnText = document.getElementById('pay-btn-text');
        
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

    document.addEventListener('DOMContentLoaded', init);

    return {
        showScreen,
        validateAndRedirect,
        toggleDarkMode,
        updateCartBadge,
        showBookDetails,
        processPayment,
        logout,
        getCurrentBookId,
        getCurrentScreenId,
    };
})();