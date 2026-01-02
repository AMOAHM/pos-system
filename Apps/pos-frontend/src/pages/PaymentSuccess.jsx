import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { salesAPI } from '../api';
import { CheckCircle, XCircle, Download, ArrowLeft } from 'lucide-react';

import { useAuth } from '../contexts/Authcontext';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState('loading');
    const [saleId, setSaleId] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const id = searchParams.get('saleId');
        const errorMessage = searchParams.get('message');

        setSaleId(id);

        if (paymentStatus === 'success' && id) {
            setStatus('success');
            setMessage('Payment completed successfully!');
            // Auto-download receipt
            downloadReceipt(id);
        } else if (paymentStatus === 'failed') {
            setStatus('failed');
            setMessage('Payment failed. Please try again.');
        } else if (paymentStatus === 'error') {
            setStatus('error');
            setMessage(errorMessage || 'An error occurred during payment.');
        }
    }, [searchParams]);

    const downloadReceipt = async (id) => {
        try {
            const blob = await salesAPI.printReceipt(id);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt_${id.substring(0, 8)}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download receipt:', error);
        }
    };

    const handleDownloadAgain = () => {
        if (saleId) {
            downloadReceipt(saleId);
        }
    };

    const handleBackToSales = () => {
        if (user?.role === 'cashier') {
            navigate('/cashier/sales');
        } else if (user?.role === 'manager') {
            navigate('/manager/sales');
        } else if (user?.role === 'admin') {
            navigate('/admin/dashboard');
        } else {
            // Fallback
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <div>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Processing payment...</p>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Successful!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Your receipt has been downloaded automatically.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleDownloadAgain}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Download Receipt Again
                            </button>

                            <button
                                onClick={handleBackToSales}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Sales
                            </button>
                        </div>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Failed
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

                        <button
                            onClick={handleBackToSales}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Sales
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Error
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

                        <button
                            onClick={handleBackToSales}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Sales
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
