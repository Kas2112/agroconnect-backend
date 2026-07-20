// frontend/src/pages/MyGigApplications.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyGigApplications = () => {
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

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/my-gig-applications/', {
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

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>📋 My Gig Applications</h1>
        <Link to="/gigs">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><p>Loading...</p></div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>You haven't applied to any gigs yet</p>
          <Link to="/gigs">
            <button style={{ marginTop: '15px', width: 'auto', padding: '12px 30px' }}>Browse Gigs</button>
          </Link>
        </div>
      ) : (
        apps.map((app) => (
          <div className="card" key={app.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3>{app.gig?.title || 'Gig'}</h3>
                <div className="seller">👤 Farmer: {app.gig?.farmer?.full_name || 'Unknown'}</div>
                <div className="location">📍 {app.gig?.location_text || 'Location not specified'}</div>
              </div>
              <span className={`badge badge-${app.status}`}>{app.status}</span>
            </div>
            <div style={{ marginTop: '10px' }}>
              {app.rate_offered && (
                <div className="price">💰 Offered: ₦{Number(app.rate_offered).toLocaleString()} / day</div>
              )}
              {app.message && (
                <div style={{ marginTop: '5px', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>
                  <small>💬 {app.message}</small>
                </div>
              )}
              {app.status === 'accepted' && (
                <div style={{ marginTop: '10px', padding: '8px', background: '#dcfce7', borderRadius: '6px', color: '#16a34a' }}>
                  ✅ You've been accepted! Contact the farmer.
                </div>
              )}
              {app.status === 'rejected' && (
                <div style={{ marginTop: '10px', padding: '8px', background: '#fee2e2', borderRadius: '6px', color: '#dc2626' }}>
                  ❌ Your application was rejected.
                </div>
              )}
            </div>
            <Link to={`/gig/${app.gig_id}`}>
              <button style={{ marginTop: '10px', width: 'auto', padding: '8px 20px', fontSize: '14px' }}>
                View Gig
              </button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
};

export default MyGigApplications;