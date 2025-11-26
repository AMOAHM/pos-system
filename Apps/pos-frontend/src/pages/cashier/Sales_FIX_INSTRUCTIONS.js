// Fix for Sales.jsx - The handleCheckout function is corrupted
// 
// PROBLEM: Lines 140-144 currently show:
//   const handleCheckout = () => {
//     if (cart.length === 0) {
//       setPaymentMethod(PAYMENT_METHODS.CASH);
//       searchInputRef.current?.focus();
//     };
//
// SOLUTION: Replace lines 140-144 with:

const handleCheckout = () => {
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }
    setShowPaymentModal(true);
};

// Add receipt download function after handleCheckout:
const downloadReceipt = async (saleId) => {
    try {
        const blob = await salesAPI.printReceipt(saleId);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt_${saleId.substring(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to download receipt:', error);
        alert('Failed to download receipt. Please try again.');
    }
};

// Then find the handlePayment function and update the cash payment section
// Find this code (around line 168-172):
//   if (paymentMethod === PAYMENT_METHODS.CASH) {
//     // Cash payment completed
//     alert('Sale completed successfully!');
//     clearCart();
//     setShowPaymentModal(false);
//   }
//
// Replace with:
if (paymentMethod === PAYMENT_METHODS.CASH) {
    // Cash payment completed - download receipt
    alert('Sale completed successfully!');

    // Download receipt
    if (response.id) {
        await downloadReceipt(response.id);
    }

    clearCart();
    setShowPaymentModal(false);
}

// Finally, the line 146 should NOT be inside handleCheckout
// Move the return statement (line 146onwards) OUTSIDE and AFTER all the handler functions
// It should be the main return of the CashierSales component function
