// frontend/src/components/PayButton.jsx
import React, { useState } from 'react';
import api from '../services/api';  // ← USE API SERVICE

const PayButton = ({ applicationId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('📤 Sending payment request for application:', applicationId);
      
      // ✅ FIXED: Using api instead of axios with hardcoded URL
      const response = await api.post('/payment/initialize/', {
        application_id: applicationId
      });

      console.log('📥 Payment response:', response.data);

      if (response.data.success) {
        // Redirect to Paystack payment page
        window.location.href = response.data.data.authorization_url;
        if (onSuccess) onSuccess(response.data);
      } else {
        let errorMsg = response.data.error || 'Payment initialization failed';
        setError(errorMsg);
        if (onError) onError({ error: errorMsg });
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      console.error('❌ Response:', err.response?.data);
      
      let errorMsg = 'Payment failed. Please try again.';
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Network error: Cannot reach payment gateway. Please check your internet connection.';
      } else if (err.response?.data?.errors) {
        const errors = Object.values(errors).flat().join(', ');
        errorMsg = errors;
      }
      
      setError(errorMsg);
      if (onError) onError({ error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-message" style={{ marginBottom: '10px' }}>
          ❌ {error}
        </div>
      )}
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#6b7280' : '#22c55e',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {loading ? '⏳ Processing...' : `💰 Pay ₦${Number(amount).toLocaleString()}`}
      </button>
    </div>
  );
};

export default PayButton;