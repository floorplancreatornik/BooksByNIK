const cart = (() => {
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];

    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        script.updateCartBadge();
    };

    const getCartItems = () => cartItems;

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const addItem = () => {
        const bookId = script.getCurrentBookId();
        const book = api.getBookData().find(b => b.id === bookId);
        
        if (!book) return;

        const existingItem = cartItems.find(item => item.id === bookId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({
                id: book.id,
                title: book.title,
                price: book.price,
                quantity: 1
            });
        }
        
        saveCart();
        alert(i18n.getKey('itemAdded'));
        script.showScreen('home');
    };

    const removeItem = (id) => {
        cartItems = cartItems.filter(item => item.id !== id);
        saveCart();
        renderCart();
    };
    
    const updateQuantity = (id, change) => {
        const item = cartItems.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeItem(id);
            } else {
                saveCart();
                renderCart();
            }
        }
    };

    const renderCart = () => {
        const cartContent = document.getElementById('cart-content');
        const cartTotal = document.getElementById('cart-total');
        const checkoutButton = document.getElementById('cart-checkout-button');
        
        if (cartItems.length === 0) {
            cartContent.innerHTML = `<p style="text-align: center; color: var(--text-muted-color);">${i18n.getKey('cartEmpty')}</p>`;
            cartTotal.innerText = '₹0';
            checkoutButton.style.display = 'none';
            return;
        }
        
        let html = cartItems.map(item => {
            const itemTotal = item.price * item.quantity;
            return `
                <div class="cart-item">
                    <div class="item-info">
                        <div class="item-title">${item.title}</div>
                        <div class="item-price">₹${item.price} x ${item.quantity} = ₹${itemTotal}</div>
                    </div>
                    <div class="item-controls">
                        <button onclick="cart.updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="cart.updateQuantity('${item.id}', 1)">+</button>
                        <button class="remove-btn" onclick="cart.removeItem('${item.id}')">${i18n.getKey('removeBtn')}</button>
                    </div>
                </div>
            `;
        }).join('');
        
        cartContent.innerHTML = html;
        cartTotal.innerText = `₹${calculateTotal()}`;
        checkoutButton.style.display = 'block';
    };

    return {
        getCartItems,
        addItem,
        removeItem,
        updateQuantity,
        calculateTotal,
        renderCart
    };
})();