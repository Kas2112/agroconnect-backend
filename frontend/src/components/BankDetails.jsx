// frontend/src/components/BankDetails.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BankDetails = () => {
  const [bankDetails, setBankDetails] = useState({
    bank_code: '',
    account_number: '',
    account_name: ''
  });
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'https://api.paystack.co/bank',
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setBanks(response.data.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const handleChange = (e) => {
    setBankDetails({
      ...bankDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/add-bank-details/',
        bankDetails,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage('✅ Bank details saved successfully!');
      }
    } catch (error) {
      setMessage('❌ Failed to save bank details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>🏦 Bank Details for Payouts</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Add your bank details to receive payments from sales
      </p>

      {message && (
        <div className={message.includes('✅') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <select
          name="bank_code"
          value={bankDetails.bank_code}
          onChange={handleChange}
          required
        >
          <option value="">Select Bank</option>
          {banks.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="account_number"
          placeholder="Account Number"
          value={bankDetails.account_number}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="account_name"
          placeholder="Account Name"
          value={bankDetails.account_name}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : '💾 Save Bank Details'}
        </button>
      </form>
    </div>
  );
};

export default BankDetails;