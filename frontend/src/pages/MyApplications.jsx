// frontend/src/pages/MyApplications.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import
import PayButton from '../components/PayButton';
import ReleasePaymentButton from '../components/ReleasePaymentButton';

const MyApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchApps();
  }, []);

  // ✅ FIXED: Using api instead of axios
  const fetchApps = async () => {
    try {
      const response = await api.get('/my-applications/');  // ← CHANGED
      setApps(response.data.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
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
      'accepted': 'badge-active',
      'declined': 'badge-sold',
      'paid': 'badge-active',
      'completed': 'badge-active'
    };
    return colors[status] || 'badge-pending';
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>📦 My Orders</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Loading your orders...</p>
        </div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>You haven't applied to buy anything yet</p>
          <Link to="/marketplace">
            <button style={{ marginTop: '15px', width: 'auto', padding: '12px 30px' }}>
              Browse Marketplace
            </button>
          </Link>
        </div>
      ) : (
        apps.map((app) => (
          <div className="card" key={app.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3>{app.ad?.title || 'Ad'}</h3>
                <div className="seller">👤 Seller: {app.ad?.seller?.full_name || 'Unknown'}</div>
                <div className="location">📍 {app.ad?.location_text || 'Location not specified'}</div>
              </div>
              <span className={`badge ${getStatusBadge(app.status)}`}>
                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </span>
            </div>
            <div style={{ marginTop: '10px' }}>
              <div>📦 Quantity: {app.requested_quantity} {app.ad?.unit || 'units'}</div>
              <div className="price">💰 Offer: ₦{Number(app.offered_price).toLocaleString()}</div>
              {app.message && (
                <div style={{ marginTop: '5px', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>
                  <small>💬 {app.message}</small>
                </div>
              )}
              
              {app.status === 'accepted' && (
                <div style={{ marginTop: '10px' }}>
                  <PayButton 
                    applicationId={app.id} 
                    amount={app.offered_price}
                    onSuccess={() => {
                      alert('✅ Payment successful! Funds are held in escrow.');
                      fetchApps();
                    }}
                    onError={(error) => {
                      alert('Payment failed: ' + (error.error || 'Unknown error'));
                    }}
                  />
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>
                    🔒 Secure payment via Paystack. Funds held in escrow until delivery.
                  </div>
                </div>
              )}
              
              {app.status === 'paid' && app.transaction && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ 
                    padding: '10px', 
                    background: '#dbeafe', 
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#2563eb' }}>
                      🔒 Payment of ₦{Number(app.offered_price).toLocaleString()} is held in escrow.
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                      Confirm delivery to release funds to the seller.
                    </p>
                  </div>
                  
                  {app.transaction && (
                    <ReleasePaymentButton 
                      transactionId={app.transaction.id}
                      onSuccess={() => {
                        alert('✅ Payment released successfully! Funds sent to seller.');
                        fetchApps();
                      }}
                      onError={(error) => {
                        alert('Failed to release payment: ' + (error.error || 'Unknown error'));
                      }}
                    />
                  )}
                </div>
              )}
              
              {app.status === 'pending' && (
                <div style={{ marginTop: '10px', padding: '8px', background: '#fef3c7', borderRadius: '6px', color: '#d97706' }}>
                  ⏳ Waiting for seller to accept your request.
                </div>
              )}
              
              {app.status === 'completed' && (
                <div style={{ marginTop: '10px', padding: '8px', background: '#dcfce7', borderRadius: '6px', color: '#16a34a' }}>
                  ✅ Transaction completed successfully!
                </div>
              )}
              {app.status === 'declined' && (
                <div style={{ marginTop: '10px', padding: '8px', background: '#fee2e2', borderRadius: '6px', color: '#dc2626' }}>
                  ❌ The seller declined your request.
                </div>
              )}
            </div>
            <Link to={`/ad/${app.ad_id}`}>
              <button style={{ marginTop: '10px', width: 'auto', padding: '8px 20px', fontSize: '14px' }}>
                View Ad
              </button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
};

export default MyApplications;