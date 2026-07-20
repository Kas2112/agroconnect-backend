// frontend/src/pages/Marketplace.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Marketplace = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchAds();
    fetchUnreadCount();
    
    // Refresh unread count every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/ads/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAds(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/messages/unread-count/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.data?.unread_count || 0);
    } catch (error) {
      // Silently fail
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>🌾 Marketplace</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      
      <div className="nav">
        <Link to="/marketplace" className="active">Browse</Link>
        <Link to="/messages">
          💬 Messages
          {unreadCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '10px',
              marginLeft: '4px'
            }}>
              {unreadCount}
            </span>
          )}
        </Link>
        {user && (user.role === 'farmer' || user.role === 'both') && (
          <>
            <Link to="/create-ad">Post Ad</Link>
            <Link to="/my-listings">My Ads</Link>
            <Link to="/received-applications">📩 Inbox</Link>
            <Link to="/gigs">👷 Gigs</Link>
            <Link to="/transactions">💰 Payments</Link>
            <Link to="/bank-details">🏦 Bank</Link>
          </>
        )}
        {user && (user.role === 'buyer' || user.role === 'both') && (
          <Link to="/my-applications">📦 My Orders</Link>
        )}
      </div>
      
      {user && <div style={{ marginBottom: '15px', color: '#4b5563' }}>Welcome, {user.full_name}! 👋</div>}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><p>Loading ads...</p></div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No ads available</p>
          {user && (user.role === 'farmer' || user.role === 'both') && (
            <Link to="/create-ad">
              <button style={{ marginTop: '15px', width: 'auto', padding: '12px 30px' }}>Post Your First Ad</button>
            </Link>
          )}
        </div>
      ) : (
        ads.map((ad) => (
          <Link to={`/ad/${ad.id}`} key={ad.id} style={{ textDecoration: 'none' }}>
            <div className="card">
              {/* ============ IMAGE THUMBNAIL ============ */}
              {ad.images && ad.images.length > 0 && (
                <img
                  src={ad.images[0]}
                  alt={ad.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                />
              )}
              <div className="flex justify-between items-start">
                <div>
                  <h3>{ad.title}</h3>
                  <div className="seller">👤 {ad.seller?.full_name || 'Unknown'}</div>
                  <div className="location">📍 {ad.location_text || 'Location not specified'}</div>
                </div>
                <span className={`badge badge-${ad.status}`}>{ad.status}</span>
              </div>
              <div className="price">₦{Number(ad.price_per_unit).toLocaleString()} / {ad.unit}</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                {ad.quantity} {ad.unit} available • {ad.crop?.name || 'Crop'}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
};

export default Marketplace;