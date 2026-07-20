// frontend/src/pages/BankDetails.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BankDetails = () => {
  const [bankDetails, setBankDetails] = useState({
    bank_code: '',
    account_number: '',
    account_name: ''
  });
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchBanks();
    fetchBankDetails();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await axios.get('https://api.paystack.co/bank', {
        headers: {
          'Authorization': `Bearer sk_test_6f49d777d82bdd68a5ee9c038e9f2308d449837b`,
          'Content-Type': 'application/json'
        }
      });
      setBanks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/bank-details/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.data.has_bank_details) {
        setHasBankDetails(true);
        setBankDetails({
          bank_code: response.data.data.bank_code || '',
          account_number: response.data.data.account_number || '',
          account_name: response.data.data.account_name || ''
        });
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
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
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/bank-details/add/',
        bankDetails,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage('✅ Bank details saved successfully!');
        setHasBankDetails(true);
        setTimeout(() => navigate('/marketplace'), 2000);
      }
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Failed to save bank details'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>🏦 Bank Details</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {hasBankDetails ? (
        <div className="card">
          <div style={{ padding: '15px', background: '#dcfce7', borderRadius: '8px', marginBottom: '15px' }}>
            <p style={{ color: '#16a34a', fontWeight: 'bold', margin: 0 }}>
              ✅ Bank details are set up
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
              You will receive payments directly to this account
            </p>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Bank:</strong> {banks.find(b => b.code === bankDetails.bank_code)?.name || 'N/A'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Account Number:</strong> {bankDetails.account_number}
          </div>
          <div>
            <strong>Account Name:</strong> {bankDetails.account_name}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ color: '#6b7280', marginBottom: '15px' }}>
            Add your bank details to receive payments from sales
          </p>

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
            placeholder="Account Name (as it appears on the bank statement)"
            value={bankDetails.account_name}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Bank Details'}
          </button>
        </form>
      )}
    </div>
  );
};

export default BankDetails;