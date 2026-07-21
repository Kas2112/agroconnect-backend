// frontend/src/pages/ReceivedGigApplications.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import

const ReceivedGigApplications = () => {
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

  // ✅ FIXED: Using api instead of axios
  const fetchApps = async () => {
    try {
      const response = await api.get('/received-gig-applications/');  // ← CHANGED
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

  // ✅ FIXED: Using api instead of axios
  const updateStatus = async (appId, status) => {
    setProcessing(appId);
    try {
      await api.put(`/gig-applications/${appId}/status/`, { status });  // ← CHANGED
      await fetchApps();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>📩 Gig Applicants</h1>
        <Link to="/gigs">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><p>Loading...</p></div>
      ) : apps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No applications yet</p>
          <p className="text-gray">Workers will apply to your gigs here</p>
        </div>
      ) : (
        apps.map((app) => (
          <div className="card" key={app.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3>{app.gig?.title || 'Gig'}</h3>
                <div className="seller">👤 Worker: {app.labourer?.full_name || 'Unknown'}</div>
                <div className="location">📞 Phone: {app.labourer?.phone || 'N/A'}</div>
              </div>
              <span className={`badge badge-${app.status}`}>{app.status}</span>
            </div>
            <div style={{ marginTop: '10px' }}>
              {app.rate_offered && (
                <div className="price">💰 Offered: ₦{Number(app.rate_offered).toLocaleString()} / day</div>
              )}
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
                  onClick={() => updateStatus(app.id, 'rejected')}
                  style={{ flex: 1, backgroundColor: '#ef4444' }}
                  disabled={processing === app.id}
                >
                  {processing === app.id ? 'Processing...' : '❌ Reject'}
                </button>
              </div>
            )}

            {app.status === 'accepted' && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#dcfce7', borderRadius: '6px', color: '#16a34a' }}>
                ✅ You accepted this worker.
              </div>
            )}

            {app.status === 'rejected' && (
              <div style={{ marginTop: '10px', padding: '8px', background: '#fee2e2', borderRadius: '6px', color: '#dc2626' }}>
                ❌ You rejected this worker.
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ReceivedGigApplications;