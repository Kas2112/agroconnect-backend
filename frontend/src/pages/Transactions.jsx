// frontend/src/pages/Transactions.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/transactions/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'badge-pending',
      'paid': 'badge-active',
      'held': 'badge-active',
      'released': 'badge-active',
      'refunded': 'badge-sold',
      'failed': 'badge-sold'
    };
    return colors[status] || 'badge-pending';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'paid': 'Paid',
      'held': 'In Escrow',
      'released': 'Released ✅',
      'refunded': 'Refunded',
      'failed': 'Failed'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>💰 Transactions</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No transactions yet</p>
          <p className="text-gray">Your payment history will appear here</p>
        </div>
      ) : (
        transactions.map((transaction) => {
          const isBuyer = user && transaction.application?.buyer?.id === user.id;
          const isSeller = user && transaction.application?.ad?.seller?.id === user.id;
          
          return (
            <div className="card" key={transaction.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3>{transaction.application?.ad?.title || 'Transaction'}</h3>
                  <div className="seller">
                    {isBuyer ? '👤 You (Buyer)' : `👤 ${transaction.application?.buyer?.full_name || 'Buyer'}`}
                  </div>
                  <div className="seller">
                    {isSeller ? '👤 You (Seller)' : `👤 ${transaction.application?.ad?.seller?.full_name || 'Seller'}`}
                  </div>
                </div>
                <span className={`badge ${getStatusBadge(transaction.status)}`}>
                  {getStatusLabel(transaction.status)}
                </span>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div className="price">💰 ₦{Number(transaction.amount).toLocaleString()}</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  📦 {transaction.application?.requested_quantity} {transaction.application?.ad?.unit}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  🏦 Platform Fee: ₦{Number(transaction.platform_fee).toLocaleString()}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  📅 {formatDate(transaction.created_at)}
                </div>
                {transaction.status === 'held' && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '8px', 
                    background: '#dbeafe', 
                    borderRadius: '6px',
                    color: '#2563eb',
                    fontSize: '14px'
                  }}>
                    🔒 Payment is held in escrow. Funds will be released after delivery confirmation.
                  </div>
                )}
                {transaction.status === 'released' && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '8px', 
                    background: '#dcfce7', 
                    borderRadius: '6px',
                    color: '#16a34a',
                    fontSize: '14px'
                  }}>
                    ✅ Payment released to seller on {formatDate(transaction.released_at)}
                  </div>
                )}
              </div>
              <Link to={`/ad/${transaction.application?.ad?.id}`}>
                <button style={{ marginTop: '10px', width: 'auto', padding: '8px 20px', fontSize: '14px' }}>
                  View Ad
                </button>
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Transactions;