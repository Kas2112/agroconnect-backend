// frontend/src/pages/ChatList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ChatList = () => {
  const [conversations, setConversations] = useState([]);
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
    fetchConversations();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/conversations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p.id !== user?.id);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 172800) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <h1 style={{ marginBottom: 0 }}>💬 Messages</h1>
        <Link to="/marketplace">
          <button style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>← Back</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No conversations yet</p>
          <p className="text-gray">Message a seller or buyer to start chatting</p>
          <Link to="/marketplace">
            <button style={{ marginTop: '15px', width: 'auto', padding: '12px 30px' }}>
              Browse Marketplace
            </button>
          </Link>
        </div>
      ) : (
        conversations.map((conversation) => {
          const otherUser = getOtherParticipant(conversation);
          return (
            <Link 
              to={`/chat/${conversation.id}`} 
              key={conversation.id}
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px',
                cursor: 'pointer'
              }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  background: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {otherUser?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#1a1a1a' }}>{otherUser?.full_name || 'Unknown'}</strong>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatTime(conversation.last_message_time)}
                    </span>
                  </div>
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conversation.last_message || 'No messages yet'}
                  </div>
                  {conversation.ad && (
                    <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                      📦 {conversation.ad.title}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
};

export default ChatList;