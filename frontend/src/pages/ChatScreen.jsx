// frontend/src/pages/ChatScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';  // ← FIXED: Proper import

const ChatScreen = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ FIXED: Using api instead of axios
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages/`);  // ← CHANGED
      const data = response.data;
      setMessages(data.data || []);
      
      // Get conversation info
      if (data.data && data.data.length > 0 && !conversation) {
        const firstMsg = data.data[0];
        if (firstMsg.conversation) {
          fetchConversationDetails();
        }
      } else if (!conversation) {
        fetchConversationDetails();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
      setLoading(false);
    }
  };

  // ✅ FIXED: Using api instead of axios
  const fetchConversationDetails = async () => {
    try {
      const response = await api.get('/conversations/');  // ← CHANGED
      const conv = response.data.data?.find(c => c.id === parseInt(conversationId));
      if (conv) {
        setConversation(conv);
        const other = conv.participants?.find(p => p.id !== user?.id);
        setOtherUser(other);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  // ✅ FIXED: Using api instead of axios
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await api.post('/messages/send/', {  // ← CHANGED
        conversation_id: parseInt(conversationId),
        content: newMessage.trim()
      });

      if (response.data.success) {
        setMessages([...messages, response.data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  // Group messages by date
  const getGroupedMessages = () => {
    const grouped = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const key = date.toDateString();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(msg);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', padding: '40px 0' }}>Loading messages...</p>
      </div>
    );
  }

  const groupedMessages = getGroupedMessages();

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '95vh', padding: '15px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        paddingBottom: '15px',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        <Link to="/messages">
          <button style={{ width: 'auto', padding: '8px 12px', fontSize: '14px' }}>←</button>
        </Link>
        <div>
          <strong style={{ fontSize: '16px' }}>{otherUser?.full_name || 'Chat'}</strong>
          {conversation?.ad && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              📦 {conversation.ad.title}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '15px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#6b7280',
                margin: '10px 0',
                padding: '4px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                alignSelf: 'center',
                display: 'inline-block',
                width: 'auto',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                {formatDate(date)}
              </div>
              {msgs.map((msg) => {
                const isOwn = msg.sender?.id === user?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: isOwn ? '#22c55e' : '#f3f4f6',
                      color: isOwn ? 'white' : '#1a1a1a',
                      wordWrap: 'break-word',
                      borderBottomRightRadius: isOwn ? '4px' : '12px',
                      borderBottomLeftRadius: isOwn ? '12px' : '4px'
                    }}>
                      {msg.content}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#6b7280',
                      marginTop: '2px',
                      textAlign: isOwn ? 'right' : 'left'
                    }}>
                      {formatTime(msg.created_at)}
                      {isOwn && msg.is_read && ' ✓✓'}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ 
        display: 'flex', 
        gap: '10px', 
        paddingTop: '10px', 
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1, marginBottom: 0 }}
          disabled={sending}
        />
        <button 
          type="submit" 
          disabled={sending || !newMessage.trim()}
          style={{ width: 'auto', padding: '12px 24px' }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatScreen;