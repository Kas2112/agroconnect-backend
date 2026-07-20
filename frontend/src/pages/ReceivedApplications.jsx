// frontend/src/pages/ReceivedApplications.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReceivedApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/received-applications/', {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const updateStatus = async (appId, status) => {
    setProcessing(appId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://127.0.0.1:8000/api/applications/${appId}/status/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchApps();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setProcessing(null);
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
        <h1 style={{ marginBottom: 0 }}>📩 Received Applications</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Loading applications...</p>
        </div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No applications yet</p>
          <p className="text-gray">Buyers will apply to your ads here</p>
        </div>
      ) : (
        apps.map((app) => (
          <div className="card" key={app.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3>{app.ad?.title || 'Ad'}</h3>
                <div className="seller">👤 Buyer: {app.buyer?.full_name || 'Unknown'}</div>
                <div className="location">📞 Phone: {app.buyer?.phone || 'N/A'}</div>
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
                  <small>💬 "{app.message}"</small>
                </div>
              )}
            </div>
            
            {app.status === 'pending' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => updateStatus(app.id, 'accepted')}
                  style={{ flex: 1, backgroundColor: '#22c55e' }}
                  disabled={processing === app.id}
                >
                  {processing === app.id ? 'Processing...' : '✅ Accept'}
                </button>
                <button 
                  onClick={() => updateStatus(app.id, 'declined')}
                  style={{ flex: 1, backgroundColor: '#ef4444' }}
                  disabled={processing === app.id}
                >
                  {processing === app.id ? 'Processing...' : '❌ Decline'}
                </button>
              </div>
            )}

            {app.status === 'accepted' && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#fef3c7', borderRadius: '6px', color: '#d97706' }}>
                ⏳ Waiting for buyer to make payment...
              </div>
            )}

            {app.status === 'paid' && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#dbeafe', borderRadius: '6px', color: '#2563eb' }}>
                🔒 Payment of ₦{Number(app.offered_price).toLocaleString()} is held in escrow.
                <br />
                <span style={{ fontSize: '13px' }}>The buyer needs to confirm delivery to release funds.</span>
              </div>
            )}

            {app.status === 'declined' && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#fee2e2', borderRadius: '6px', color: '#dc2626' }}>
                ❌ You declined this request.
              </div>
            )}

            {app.status === 'completed' && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#dcfce7', borderRadius: '6px', color: '#16a34a' }}>
                ✅ Transaction completed. Payment has been released.
              </div>
            )}

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

export default ReceivedApplications;