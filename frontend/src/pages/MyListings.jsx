// frontend/src/pages/MyListings.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import

const MyListings = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchMyAds();
  }, []);

  // ✅ FIXED: Using api instead of axios
  const fetchMyAds = async () => {
    try {
      const response = await api.get('/my-ads/');  // ← CHANGED
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

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>📋 My Listings</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><p>Loading...</p></div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No ads yet</p>
          <Link to="/create-ad">
            <button style={{ marginTop: '15px', width: 'auto', padding: '12px 30px' }}>Post Your First Ad</button>
          </Link>
        </div>
      ) : (
        ads.map((ad) => (
          <div className="card" key={ad.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3>{ad.title}</h3>
                <div className="location">📍 {ad.location_text}</div>
                <div className="seller">🌾 {ad.crop?.name}</div>
              </div>
              <span className={`badge badge-${ad.status}`}>{ad.status}</span>
            </div>
            <div className="price">₦{Number(ad.price_per_unit).toLocaleString()} / {ad.unit}</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>{ad.quantity} {ad.unit} available</div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyListings;