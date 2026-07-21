// frontend/src/pages/AdDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';  // ← Using api, not axios

const AdDetails = () => {
  const { id } = useParams();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    requested_quantity: '',
    offered_price: '',
    message: ''
  });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
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
    fetchAdDetails();
  }, []);

  // ✅ FIXED - Using api instead of axios
  const fetchAdDetails = async () => {
    try {
      const response = await api.get(`/ads/${id}/`);  // ← CHANGED
      setAd(response.data.data);
      setApplicationData(prev => ({
        ...prev,
        requested_quantity: response.data.data.quantity || '',
        offered_price: response.data.data.price_per_unit || ''
      }));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChange = (e) => {
    setApplicationData({
      ...applicationData,
      [e.target.name]: e.target.value
    });
  };

  // ✅ FIXED - Using api instead of axios
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const response = await api.post('/applications/create/', {  // ← CHANGED
        ad_id: parseInt(id),
        requested_quantity: parseFloat(applicationData.requested_quantity),
        offered_price: parseFloat(applicationData.offered_price),
        message: applicationData.message || ''
      });

      if (response.data.success) {
        setApplySuccess('✅ Application submitted successfully! The farmer will review your request.');
        setShowApplyForm(false);
        setApplicationData({
          requested_quantity: '',
          offered_price: '',
          message: ''
        });
      }
    } catch (err) {
      console.error('Error applying:', err);
      if (err.response?.data?.error) {
        setApplyError(err.response.data.error);
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join(' | ');
        setApplyError(errorMessages);
      } else {
        setApplyError('Failed to submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  // ✅ FIXED - Using api instead of axios
  const startChat = async () => {
    try {
      const response = await api.post('/conversations/create/', {  // ← CHANGED
        other_user_id: ad.seller.id,
        ad_id: ad.id
      });
      
      if (response.data.success) {
        navigate(`/chat/${response.data.data.id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  // Rest of the component remains the same...
  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (!ad) return <div className="container"><p>Ad not found</p></div>;

  const isOwnAd = user && ad.seller && user.id === ad.seller.id;

  return (
    <div className="container">
      <Link to="/marketplace">
        <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', marginBottom: '20px' }}>
          ← Back to Marketplace
        </button>
      </Link>

      <h2>{ad.title}</h2>
      
      {ad.images && ad.images.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          overflowX: 'auto', 
          marginBottom: '15px',
          paddingBottom: '10px'
        }}>
          {ad.images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`${ad.title} - ${index + 1}`}
              style={{
                width: '150px',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                flexShrink: 0,
                cursor: 'pointer'
              }}
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      )}
      
      <div className="card">
        <div className="seller">👤 Seller: {ad.seller?.full_name || 'Unknown'}</div>
        <div className="location">📍 {ad.location_text || 'Location not specified'}</div>
        <div style={{ margin: '10px 0' }}>
          <span className={`badge badge-${ad.status}`}>{ad.status}</span>
        </div>
        <div className="price">₦{Number(ad.price_per_unit).toLocaleString()} / {ad.unit}</div>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          📦 {ad.quantity} {ad.unit} available
        </div>
        <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
          🌾 {ad.crop?.name || 'Crop'}
        </div>
        {ad.description && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: 0 }}>{ad.description}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {ad.status === 'active' && !isOwnAd && (
          <button 
            onClick={() => setShowApplyForm(true)} 
            style={{ flex: 1, minWidth: '120px' }}
          >
            📩 Apply to Buy
          </button>
        )}
        {!isOwnAd && (
          <button 
            onClick={startChat} 
            style={{ flex: 1, minWidth: '120px', backgroundColor: '#3b82f6' }}
          >
            💬 Message Seller
          </button>
        )}
      </div>

      {showApplyForm && (
        <div style={{ marginTop: '15px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
          <h3 style={{ marginBottom: '10px' }}>📝 Submit Purchase Request</h3>
          
          {applyError && <div className="error-message">{applyError}</div>}
          {applySuccess && <div className="success-message">{applySuccess}</div>}
          
          <form onSubmit={handleApplySubmit}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity ({ad.unit}):</label>
              <input
                type="number"
                name="requested_quantity"
                placeholder="How many do you want?"
                value={applicationData.requested_quantity}
                onChange={handleApplyChange}
                required
                min="1"
                max={ad.quantity}
              />
              <small style={{ color: '#6b7280' }}>Maximum available: {ad.quantity} {ad.unit}</small>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Your Offer Price (₦):</label>
              <input
                type="number"
                name="offered_price"
                placeholder="Total amount you're offering"
                value={applicationData.offered_price}
                onChange={handleApplyChange}
                required
                min="1"
              />
              <small style={{ color: '#6b7280' }}>
                Suggested: ₦{Number(ad.price_per_unit * ad.quantity).toLocaleString()} for all {ad.quantity} {ad.unit}
              </small>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message (Optional):</label>
              <textarea
                name="message"
                placeholder="Add a note to the seller (e.g., I'll arrange pickup)"
                value={applicationData.message}
                onChange={handleApplyChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '60px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" disabled={applying} style={{ flex: 1 }}>
                {applying ? 'Submitting...' : '📩 Submit Request'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowApplyForm(false)} 
                style={{ flex: 1, backgroundColor: '#6b7280' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isOwnAd && (
        <div style={{ marginTop: '15px', padding: '10px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>📢 This is your own ad. You cannot apply to buy it.</p>
        </div>
      )}

      {ad.status !== 'active' && (
        <div style={{ marginTop: '15px', padding: '10px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>⛔ This ad is no longer available (Status: {ad.status})</p>
        </div>
      )}
    </div>
  );
};

export default AdDetails;