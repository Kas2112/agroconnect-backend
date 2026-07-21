// frontend/src/pages/PaymentVerify.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('No payment reference found');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.get(`/payment/verify/?reference=${reference}`);  // ← CHANGED
        console.log('📥 Verification Response:', response.data);

        if (response.data.success) {
          setStatus('success');
          setMessage('✅ Payment verified successfully! Funds are held in escrow.');
          setTimeout(() => navigate('/my-applications'), 3000);
        } else {
          setStatus('error');
          setMessage('❌ ' + (response.data.error || 'Payment verification failed'));
        }
      } catch (error) {
        console.error('❌ Verification error:', error);
        setStatus('error');
        setMessage('❌ ' + (error.response?.data?.error || 'Payment verification failed'));
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <div className="container" style={{ textAlign: 'center', padding: '40px 0' }}>
      <h2>Payment Verification</h2>
      <div style={{ marginTop: '20px' }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '48px' }}>⏳</div>
            <p>Verifying your payment...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px' }}>✅</div>
            <p style={{ color: '#16a34a' }}>{message}</p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Redirecting to your orders...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px' }}>❌</div>
            <p style={{ color: '#dc2626' }}>{message}</p>
            <button 
              onClick={() => navigate('/my-applications')}
              style={{ marginTop: '20px', width: 'auto', padding: '12px 30px' }}
            >
              Go to My Orders
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentVerify;