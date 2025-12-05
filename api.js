const api = (() => {
    
    // FINAL DEPLOYED GOOGLE APPS SCRIPT URL
    const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxkFbTN1zSAvq8IJGW8i13S8QUuIcLNQDzzHakS7yG5_rpscF4GfPhj2Hc2wgdApGMvvQ/exec'; 

    const getBookData = () => {
        return bookData; // Uses the data from book_data.js
    };

    const submitOrder = (orderData) => {
        
        const name = localStorage.getItem('userName') || 'N/A';
        const phone = localStorage.getItem('userPhone') || 'N/A';
        
        const payload = {
            type: 'ORDER_SUBMISSION', 
            timestamp: new Date().toISOString(),
            user: { name, phone }, 
            ...orderData 
        };
        
        console.log("Submitting order to Webhook:", payload);
        
        return fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(() => {
            const orderId = `BBN-${Math.floor(Math.random() * 100000) + 100000}`;
            return { success: true, orderId: orderId };
        })
        .catch(error => {
            console.error('Error submitting order to Sheet Webhook:', error);
            const orderId = `BBN-FAIL-${Math.floor(Math.random() * 1000) + 1000}`;
            return { success: false, orderId: orderId };
        });
    };

    // Generates the UPI payment deep link using the custom note format
    const generateUpiLink = (total, customNote) => {
        const merchantVpa = "nikbooks@upi"; 
        const transactionRef = `ORDER-${Date.now()}`;
        
        const encodedNote = encodeURIComponent(customNote);

        const upiLink = `upi://pay?pa=${merchantVpa}&pn=NIK Books&am=${total}&cu=INR&tid=${transactionRef}&tn=${encodedNote}`;
        
        return upiLink;
    };


    return {
        getBookData,
        submitOrder,
        generateUpiLink,
    };
})();