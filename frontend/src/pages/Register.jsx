import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', full_name: '', phone: '', password: '', password2: '', role: 'buyer', location_state: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
     const response = await api.post('/register/', {
    username: formData.username,
    full_name: formData.full_name,
    phone: formData.phone,
    password: formData.password,
    role: formData.role,
    location_state: formData.location_state
});

      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        navigate('/marketplace');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🌾 Agro Connect</h1>
      <h2>Create your account</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
        <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />
        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
        <select name="role" value={formData.role} onChange={handleChange} required>
          <option value="buyer">I am a Buyer</option>
          <option value="farmer">I am a Farmer</option>
          <option value="both">I am both</option>
        </select>
        <input type="text" name="location_state" placeholder="Your State" value={formData.location_state} onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <input type="password" name="password2" placeholder="Confirm Password" value={formData.password2} onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
      </form>
      <p className="text-center mt-20">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default Register;
