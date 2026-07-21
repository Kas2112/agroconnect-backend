// frontend/src/pages/CreateAd.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import
import ImageUpload from '../components/ImageUpload';

const CreateAd = () => {
  const [formData, setFormData] = useState({
    crop_id: '',
    title: '',
    quantity: '',
    unit: 'kg',
    price_per_unit: '',
    location_text: ''
  });
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCrops();
  }, []);

  // ✅ FIXED: Using api instead of axios
  const fetchCrops = async () => {
    try {
      const response = await api.get('/crops/');  // ← CHANGED
      setCrops(response.data.data);
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ FIXED: Using api instead of axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        images: images
      };
      
      console.log('📤 Sending to Django:', payload);
      
      const response = await api.post('/ads/create/', payload);  // ← CHANGED

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        setSuccess('✅ Ad created successfully!');
        setTimeout(() => navigate('/my-listings'), 2000);
      }
    } catch (err) {
      console.error('❌ ERROR:', err);
      console.error('❌ Response data:', err.response?.data);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join(' | ');
        setError(`❌ ${errorMessages}`);
      } else if (err.response?.data?.error) {
        setError(`❌ ${err.response.data.error}`);
      } else {
        setError('❌ Failed to create ad. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>📦 Create Ad</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <select name="crop_id" value={formData.crop_id} onChange={handleChange} required>
          <option value="">Select Crop</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>{crop.name} ({crop.category})</option>
          ))}
        </select>
        <input type="text" name="title" placeholder="Ad Title" value={formData.title} onChange={handleChange} required />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} required style={{ flex: 2 }} />
          <select name="unit" value={formData.unit} onChange={handleChange} style={{ flex: 1 }}>
            <option value="kg">kg</option>
            <option value="tonnes">tonnes</option>
            <option value="bags">bags</option>
            <option value="crates">crates</option>
            <option value="pieces">pieces</option>
          </select>
        </div>
        <input type="number" name="price_per_unit" placeholder="Price per unit (₦)" value={formData.price_per_unit} onChange={handleChange} required />
        <input type="text" name="location_text" placeholder="Location" value={formData.location_text} onChange={handleChange} required />
        
        {/* Image Upload Component */}
        <ImageUpload onImagesChange={setImages} existingImages={[]} />
        
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Post Ad'}</button>
      </form>
    </div>
  );
};

export default CreateAd;