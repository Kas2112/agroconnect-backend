// frontend/src/pages/GigDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GigDetails = () => {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    message: '',
    rate_offered: ''
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
    if (userData) setUser(JSON.parse(userData));
    fetchGigDetails();
  }, []);

  const fetchGigDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:8000/api/gigs/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGig(response.data.data);
      setApplicationData(prev => ({
        ...prev,
        rate_offered: response.data.data.rate_per_day || ''
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

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/gigs/apply/',
        {
          gig_id: parseInt(id),
          message: applicationData.message || '',
          rate_offered: parseFloat(applicationData.rate_offered) || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setApplySuccess('✅ Application submitted successfully!');
        setShowApplyForm(false);
      }
    } catch (err) {
      setApplyError(err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
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

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (!gig) return <div className="container"><p>Gig not found</p></div>;

  const isOwnGig = user && gig.farmer && user.id === gig.farmer.id;

  return (
    <div className="container">
      <Link to="/gigs">
        <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', marginBottom: '20px' }}>
          ← Back to Gigs
        </button>
      </Link>

      <h2>{gig.title}</h2>
      
      <div className="card">
        <div className="seller">👤 Posted by: {gig.farmer?.full_name || 'Unknown'}</div>
        <div className="location">📍 {gig.location_text}</div>
        <div style={{ margin: '10px 0' }}>
          <span className={`badge badge-${gig.status}`}>{gig.status}</span>
        </div>
        
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' }}>
            {getCategoryIcon(gig.category)} {gig.category.replace('_', ' ').toUpperCase()}
          </span>
          <span style={{ backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' }}>
            📅 {formatDate(gig.start_date)} - {formatDate(gig.end_date)}
          </span>
          <span style={{ backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '12px', fontSize: '13px' }}>
            ⏰ {gig.daily_hours} hours/day
          </span>
        </div>

        <div className="price">₦{Number(gig.rate_per_day).toLocaleString()} / day</div>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          👥 {gig.number_of_workers_needed} worker{gig.number_of_workers_needed > 1 ? 's' : ''} needed
        </div>

        <div style={{ marginTop: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}>{gig.description}</p>
        </div>
      </div>

      {/* Apply Button */}
      {gig.status === 'active' && !isOwnGig && (
        <div>
          {!showApplyForm ? (
            <button onClick={() => setShowApplyForm(true)} style={{ marginTop: '10px' }}>
              📩 Apply for this Gig
            </button>
          ) : (
            <div style={{ marginTop: '15px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
              <h3 style={{ marginBottom: '10px' }}>📝 Apply for this Gig</h3>
              
              {applyError && <div className="error-message">{applyError}</div>}
              {applySuccess && <div className="success-message">{applySuccess}</div>}
              
              <form onSubmit={handleApplySubmit}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Your Rate (₦/day):</label>
                  <input
                    type="number"
                    name="rate_offered"
                    placeholder="Your rate per day"
                    value={applicationData.rate_offered}
                    onChange={handleApplyChange}
                    min="1"
                  />
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message (Optional):</label>
                  <textarea
                    name="message"
                    placeholder="Tell the farmer why you're a good fit"
                    value={applicationData.message}
                    onChange={handleApplyChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '60px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button type="submit" disabled={applying} style={{ flex: 1 }}>
                    {applying ? 'Submitting...' : '📩 Submit Application'}
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
        </div>
      )}

      {isOwnGig && (
        <div style={{ marginTop: '15px', padding: '10px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>📢 This is your own gig. You cannot apply to it.</p>
        </div>
      )}

      {gig.status !== 'active' && (
        <div style={{ marginTop: '15px', padding: '10px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>⛔ This gig is no longer available (Status: {gig.status})</p>
        </div>
      )}
    </div>
  );
};

export default GigDetails;