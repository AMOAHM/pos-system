// Add this useEffect to Sales.jsx after the keyboard shortcuts useEffect (around line 51)
// This handles payment redirect callbacks from Paystack

useEffect(() => {
    // Handle payment callback from Paystack
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const saleId = urlParams.get('saleId');
    const errorMessage = urlParams.get('message');

    if (paymentStatus === 'success' && saleId) {
        // Payment successful - download receipt
        alert('Payment completed successfully!');
        downloadReceipt(saleId).then(() => {
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (paymentStatus === 'failed' && saleId) {
        alert('Payment failed. Please try again.');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'error') {
        alert(`Payment error: ${errorMessage || 'Unknown error'}`);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}, []);
