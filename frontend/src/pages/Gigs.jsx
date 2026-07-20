// frontend/src/pages/Gigs.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Gigs = () => {
  const [gigs, setGigs] = useState([]);
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
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/gigs/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGigs(response.data.data);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'harvesting': '🌾',
      'planting': '🌱',
      'pest_control': '🐛',
      'irrigation': '💧',
      'transport': '🚚',
      'packaging': '📦',
      'other': '🔧'
    };
    return icons[category] || '🔧';
  };

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'badge-active',
      'filled': 'badge-pending',
      'completed': 'badge-sold',
      'cancelled': 'badge-sold'
    };
    return colors[status] || 'badge-pending';
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>👷 Gigs</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      <div className="nav">
        <Link to="/gigs" className="active">Browse Gigs</Link>
        {user && (user.role === 'farmer' || user.role === 'both') && (
          <>
            <Link to="/create-gig">Post Gig</Link>
            <Link to="/my-gigs">My Gigs</Link>
            <Link to="/received-gig-applications">📩 Applicants</Link>
          </>
        )}
        {user && (user.role === 'labourer' || user.role === 'both') && (
          <Link to="/my-gig-applications">📋 My Applications</Link>
        )}
      </div>

      {user && <div style={{ marginBottom: '15px', color: '#4b5563' }}>Welcome, {user.full_name}! 👋</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><p>Loading gigs...</p></div>
      ) : gigs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No gigs available</p>
          {user && (user.role === 'farmer' || user.role === 'both') && (
            <Link to="/create-gig">
              <button style={{ marginTop: '15px', width: 'auto', padding: '12px 30px' }}>Post Your First Gig</button>
            </Link>
          )}
        </div>
      ) : (
        gigs.map((gig) => (
          <Link to={`/gig/${gig.id}`} key={gig.id} style={{ textDecoration: 'none' }}>
            <div className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3>{gig.title}</h3>
                  <div className="seller">👤 {gig.farmer?.full_name || 'Unknown'}</div>
                  <div className="location">📍 {gig.location_text}</div>
                </div>
                <span className={`badge ${getStatusBadge(gig.status)}`}>
                  {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                </span>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' }}>
                  {getCategoryIcon(gig.category)} {gig.category.replace('_', ' ').toUpperCase()}
                </span>
                <span style={{ backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' }}>
                  📅 {formatDate(gig.start_date)} - {formatDate(gig.end_date)}
                </span>
              </div>
              <div className="price">₦{Number(gig.rate_per_day).toLocaleString()} / day</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                👥 {gig.number_of_workers_needed} worker{gig.number_of_workers_needed > 1 ? 's' : ''} needed
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
};

export default Gigs;