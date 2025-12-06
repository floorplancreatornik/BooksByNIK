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
        
        const savedLang = localStorage.getItem('language');
        if (savedLang) {
             i18n.setLanguage(savedLang); 
        }

        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'home.html';
        } else {
             if (document.getElementById('login-screen')) {
                 document.getElementById('login-screen').style.display = 'flex';
             }
        }
    };

    const login = () => {
        const name = document.getElementById('login-name').value.trim();
        const phone = document.getElementById('login-phone').value.trim();
        const lang = document.getElementById('login-language').value; 

        if (name === "" || phone.length !== 10 || isNaN(phone) || !lang) {
            alert(i18n.getKey('loginValidation'));
            return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', name);
        localStorage.setItem('userPhone', phone);
        
        localStorage.setItem('language', lang); 

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

        i18n.init();
    };

    // CRITICAL FIX FOR EMPTY BOOK LIST: Aggressive check-and-wait loop
    const waitForApiAndRender = (callback) => {
        if (typeof api !== 'undefined' && typeof api.getBookData === 'function') {
            callback();
        } else {
            console.warn("API not ready. Waiting 50ms...");
            // Poll every 50ms until the API object is defined
            setTimeout(() => waitForApiAndRender(callback), 50); 
        }
    };
    
    const init = () => {
        i18n.init(); 

        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }

        updateCartBadge();
        
        // Use the aggressive check-and-wait function instead of simple setTimeout
        if (document.URL.includes('home.html')) {
             waitForApiAndRender(renderBookList);
        }
    };

    const renderBookList = () => {
        const bookListContainer = document.getElementById('book-list');
        
        // Since we are inside waitForApiAndRender, we assume api.getBookData is available
        const bookData = api.getBookData();

        // CRITICAL DEBUG STEP: What does the console (F12) show here?
        console.log('Book Data received (FINAL CHECK):', bookData); 

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
            bookListContainer.innerHTML = '<p style="text-align: center; color: #999;">Book list is currently empty or failed to load. Check console (F12) for details.</p>';
        }
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

    // ... (processPayment function remains the same) ...

    const renderProfile = () => {
        const profileContent = document.querySelector('#profile-screen .profile-content');
        const name = localStorage.getItem('userName') || 'User';
        const phone = localStorage.getItem('userPhone') || 'N/A';
        const currentLang = i18n.currentLanguage;
        
        const enSelected = currentLang === 'en' ? 'selected' : '';
        const mlSelected = currentLang === 'ml' ? 'selected' : '';

        profileContent.innerHTML = `
            <div class="info-section" style="text-align: left;">
                <p><strong>${i18n.getKey('loginNameLabel')}:</strong> ${name}</p>
                <p><strong>${i18n.getKey('loginPhoneLabel')}:</strong> +91 ${phone}</p>
                <p style="margin-top: 15px; color: #7f8c8d;">${i18n.getKey('profileNote')}</p>
            </div>
            
            <hr style="width: 100%; border: 0; border-top: 1px solid var(--border-color); margin: 20px 0;">

            <h3 data-i18n="profileLanguageHeader">Change Language</h3>
            <div class="input-group" style="width: 100%; margin-top: 10px; display: flex; gap: 10px;">
                <select id="profile-language-select" class="language-select" style="flex-grow: 1;">
                    <option value="en" data-i18n="langEnglish" ${enSelected}>English</option>
                    <option value="ml" data-i18n="langMalayalam" ${mlSelected}>മലയാളം</option>
                </select>
                <button class="continue-button" style="width: auto; padding: 10px 15px;" onclick="script.changeProfileLanguage()">
                    ${i18n.getKey('profileLanguageBtn')}
                </button>
            </div>
            
            <button class="continue-button ml" onclick="script.logout()">${i18n.getKey('logoutBtn')}</button>
        `;
        
        i18n.init();
    };

    // CRITICAL FIX FOR LANGUAGE TOGGLE: Separate function to handle language change explicitly
    const changeProfileLanguage = () => {
        const select = document.getElementById('profile-language-select');
        if (select) {
            // Set the new language via i18n
            i18n.setLanguage(select.value);
            // After i18n.setLanguage runs, it calls script.showScreen, which re-renders the profile 
            // and stabilizes the language setting.
        }
    }

    // ... (toggleDarkMode, updateCartBadge, logout, renderCheckout, renderThankYou, getCurrentBookId, getCurrentScreenId remain the same) ...

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
        changeProfileLanguage, // EXPOSED NEW FUNCTION
    };
})();