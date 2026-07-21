// frontend/src/pages/MyGigs.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import

const MyGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchMyGigs();
  }, []);

  // ✅ FIXED: Using api instead of axios
  const fetchMyGigs = async () => {
    try {
      const response = await api.get('/my-gigs/');  // ← CHANGED
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

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>📋 My Gigs</h1>
        <Link to="/gigs">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><p>Loading...</p></div>
      ) : gigs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>You haven't posted any gigs yet</p>
          <Link to="/create-gig">
            <button style={{ marginTop: '15px', width: 'auto', padding: '12px 30px' }}>Post Your First Gig</button>
          </Link>
        </div>
      ) : (
        gigs.map((gig) => (
          <Link to={`/gig/${gig.id}`} key={gig.id} style={{ textDecoration: 'none' }}>
            <div className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3>{gig.title}</h3>
                  <div className="location">📍 {gig.location_text}</div>
                </div>
                <span className={`badge badge-${gig.status}`}>{gig.status}</span>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

export default MyGigs;