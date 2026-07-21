// frontend/src/pages/CreateGig.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import

const CreateGig = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    location_text: '',
    start_date: '',
    end_date: '',
    daily_hours: 8,
    rate_per_day: '',
    number_of_workers_needed: 1,
    skills_required: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  // ✅ FIXED: Using api instead of axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/gigs/create/', formData);  // ← CHANGED

      if (response.data.success) {
        setSuccess('✅ Gig posted successfully!');
        setTimeout(() => navigate('/my-gigs'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>👷 Post a Gig</h1>
        <Link to="/gigs">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Job Title (e.g., Harvest Hands Needed)"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Job Description"
          value={formData.description}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '100px', marginBottom: '15px' }}
        />

        <select name="category" value={formData.category} onChange={handleChange} required>
          <option value="harvesting">🌾 Harvesting</option>
          <option value="planting">🌱 Planting</option>
          <option value="pest_control">🐛 Pest Control</option>
          <option value="irrigation">💧 Irrigation</option>
          <option value="transport">🚚 Transport</option>
          <option value="packaging">📦 Packaging</option>
          <option value="other">🔧 Other</option>
        </select>

        <input
          type="text"
          name="location_text"
          placeholder="Location (e.g., Oyo, Nigeria)"
          value={formData.location_text}
          onChange={handleChange}
          required
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            name="start_date"
            placeholder="Start Date"
            value={formData.start_date}
            onChange={handleChange}
            required
            style={{ flex: 1 }}
          />
          <input
            type="date"
            name="end_date"
            placeholder="End Date"
            value={formData.end_date}
            onChange={handleChange}
            required
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            name="daily_hours"
            placeholder="Daily Hours"
            value={formData.daily_hours}
            onChange={handleChange}
            required
            style={{ flex: 1 }}
          />
          <input
            type="number"
            name="rate_per_day"
            placeholder="Rate per Day (₦)"
            value={formData.rate_per_day}
            onChange={handleChange}
            required
            style={{ flex: 1 }}
          />
        </div>

        <input
          type="number"
          name="number_of_workers_needed"
          placeholder="Number of Workers Needed"
          value={formData.number_of_workers_needed}
          onChange={handleChange}
          required
          min="1"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Posting...' : '📢 Post Gig'}
        </button>
      </form>
    </div>
  );
};

export default CreateGig;