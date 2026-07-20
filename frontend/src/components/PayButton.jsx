// frontend/src/components/PayButton.jsx
import React, { useState } from 'react';
import axios from 'axios';

const PayButton = ({ applicationId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/payment/initialize/',
        { application_id: applicationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Redirect to Paystack payment page
        window.location.href = response.data.data.authorization_url;
        if (onSuccess) onSuccess(response.data);
      } else {
        setError(response.data.error || 'Payment initialization failed');
        if (onError) onError(response.data);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      if (onError) onError(err.response?.data);
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
          backgroundColor: '#22c55e',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          width: '100%'
        }}
      >
        {loading ? '⏳ Processing...' : `💰 Pay ₦${Number(amount).toLocaleString()}`}
      </button>
    </div>
  );
};

export default PayButton;