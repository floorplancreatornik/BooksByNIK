const i18n = (() => {
    let currentLanguage = localStorage.getItem('language') || 'ml';

    const translations = {
        ml: {
            appTitle: 'ബുക്സ് ബൈ നിക്',
            loginHeader: 'ലോഗിൻ ചെയ്യുക',
            loginNameLabel: 'പേര്',
            loginPhoneLabel: 'ഫോൺ നമ്പർ',
            loginBtn: 'തുടരുക',
            loginValidation: 'പേരും ശരിയായ 10 അക്ക ഫോൺ നമ്പറും നൽകുക.',
            homeHeader: 'പുസ്തകങ്ങളുടെ ലിസ്റ്റ്',
            cartHeader: 'കാർട്ട്',
            profileHeader: 'പ്രൊഫൈൽ',
            author: 'എഴുത്തുകാരൻ',
            category: 'വിഭാഗം',
            price: 'വില',
            itemAdded: 'കാർട്ടിൽ ചേർത്തു!',
            cartEmpty: 'നിങ്ങളുടെ കാർട്ട് ശൂന്യമാണ്.',
            removeBtn: 'നീക്കം ചെയ്യുക',
            checkoutHeader: 'ചെക്ക്ഔട്ട്',
            checkoutSummary: 'ഓർഡർ സംഗ്രഹം',
            userDetails: 'ഉപയോക്തൃ വിവരങ്ങൾ', // FIX: Added this key
            shippingDetails: 'ഷിപ്പിംഗ് വിവരങ്ങൾ', // FIX: Added this key
            checkoutAddressLabel: 'ഷിപ്പിംഗ് വിലാസം',
            checkoutPincodeLabel: 'പിൻകോഡ്',
            checkoutBtn: 'പേയ്‌മെന്റ് തുടരുക',
            checkoutValidation: 'ദയവായി സാധുവായ പേര്, ഫോൺ നമ്പർ, വിലാസം, 6 അക്ക പിൻകോഡ് എന്നിവ നൽകുക.',
            payBtnText: 'പേയ്‌മെന്റ് നടത്തുക (₹0)',
            thankYouHeader: 'ഓർഡർ പൂർത്തിയായി!',
            thankYouMessage: 'നിങ്ങളുടെ ഓർഡർ വിജയകരമായി ലഭിച്ചു. പേയ്‌മെന്റ് പൂർത്തിയാക്കിയ ശേഷം നിങ്ങളുടെ ഓർഡർ ഉടൻ ഷിപ്പ് ചെയ്യുന്നതാണ്.',
            orderId: 'ഓർഡർ ഐഡി:',
            profileNote: 'നിങ്ങളുടെ വിവരങ്ങൾ പ്രാദേശികമായി സേവ് ചെയ്തിരിക്കുന്നു.',
            logoutBtn: 'ലോഗ്ഔട്ട് ചെയ്യുക',
            darkModeToggle: 'നൈറ്റ് മോഡ്'
        },
        en: {
            appTitle: 'BooksByNIK',
            loginHeader: 'Login',
            loginNameLabel: 'Full Name',
            loginPhoneLabel: 'Phone Number',
            loginBtn: 'Continue',
            loginValidation: 'Please enter a valid name and 10-digit phone number.',
            homeHeader: 'Book List',
            cartHeader: 'Cart',
            profileHeader: 'Profile',
            author: 'Author',
            category: 'Category',
            price: 'Price',
            itemAdded: 'Added to cart!',
            cartEmpty: 'Your cart is empty.',
            removeBtn: 'Remove',
            checkoutHeader: 'Checkout',
            checkoutSummary: 'Order Summary',
            userDetails: 'User Details', // FIX: Added this key
            shippingDetails: 'Shipping Details', // FIX: Added this key
            checkoutAddressLabel: 'Shipping Address',
            checkoutPincodeLabel: 'Pincode',
            checkoutBtn: 'Proceed to Payment',
            checkoutValidation: 'Please enter a valid name, phone number, address, and 6-digit Pincode.',
            payBtnText: 'Pay (₹0)',
            thankYouHeader: 'Order Complete!',
            thankYouMessage: 'Your order has been successfully placed. Once payment is complete, your order will be shipped shortly.',
            orderId: 'Order ID:',
            profileNote: 'Your information is saved locally.',
            logoutBtn: 'Logout',
            darkModeToggle: 'Dark Mode'
        }
    };

    const setLanguage = (lang) => {
        if (translations[lang]) {
            currentLanguage = lang;
            localStorage.setItem('language', lang);
            init(); // Re-initializes all data-i18n attributes

            // FIX for Persistence: Forces the current screen to re-render using the new language
            if (script && script.getCurrentScreenId) { 
                script.showScreen(script.getCurrentScreenId()); 
            }
        }
    };

    const getKey = (key) => {
        return translations[currentLanguage][key] || key;
    };
    
    const init = () => {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', getKey(key));
            } else {
                element.innerText = getKey(key);
            }
        });
        document.getElementById('lang-toggle').innerText = currentLanguage === 'ml' ? 'English' : 'മലയാളം';
    };

    return {
        init,
        getKey,
        setLanguage,
        currentLanguage
    };
})();