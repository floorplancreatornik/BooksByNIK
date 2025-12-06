const loginScript = (() => {

    const validateAndRedirect = () => {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (name === "" || phone.length !== 10 || isNaN(phone)) {
            alert(i18n.getKey('loginValidation'));
            return;
        }

        // 1. Save data to Local Storage
        localStorage.setItem('userName', name);
        localStorage.setItem('userPhone', phone);
        localStorage.setItem('isLoggedIn', 'true');

        // 2. Redirect the user to the main app page
        window.location.href = 'home.html'; 
    };
    
    const init = () => {
        i18n.init(); 
        
        // If already logged in, skip straight to home.html
        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'home.html';
        }
    };

    document.addEventListener('DOMContentLoaded', init);

    return {
        validateAndRedirect,
    };
})();