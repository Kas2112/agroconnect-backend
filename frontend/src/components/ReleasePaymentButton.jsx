// frontend/src/components/ReleasePaymentButton.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ReleasePaymentButton = ({ transactionId, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleRelease = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/payment/release/',
        { transaction_id: transactionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('📥 Release response:', response.data);

      if (response.data.success) {
        setShowConfirm(false);
        if (onSuccess) onSuccess(response.data);
      } else {
        setError(response.data.error || 'Failed to release payment');
        if (onError) onError(response.data);
      }
    } catch (err) {
      console.error('❌ Release error:', err);
      console.error('❌ Response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to release payment');
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

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          style={{
            backgroundColor: '#22c55e',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          ✅ Confirm Delivery & Release Payment
        </button>
      ) : (
        <div style={{ 
          padding: '15px', 
          background: '#fef3c7', 
          borderRadius: '8px',
          border: '1px solid #f59e0b'
        }}>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            ⚠️ Confirm you have received the goods?
          </p>
          <p style={{ marginBottom: '15px', fontSize: '14px', color: '#6b7280' }}>
            This will release the payment to the seller. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRelease}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? '#6b7280' : '#22c55e',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Processing...' : '✅ Yes, Confirm & Release'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                flex: 1,
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleasePaymentButton;