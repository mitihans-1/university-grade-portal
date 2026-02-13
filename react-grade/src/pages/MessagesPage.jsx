import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';
import { useToast } from '../components/common/Toast';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { MessageSquare, Search, Plus, User, Send, MoreHorizontal, Phone, Video, Info, Paperclip, Smile, ShieldCheck, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../admin-dashboard.css';

const MessagesPage = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const location = useLocation();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setLoading(true);
                const data = await api.getConversations();
                setConversations(data);

                const queryParams = new URLSearchParams(location.search);
                const targetId = queryParams.get('userId');
                const targetRole = queryParams.get('userRole');
                const targetName = queryParams.get('userName');

                if (targetId && targetRole) {
                    const existingConv = data.find(c => c.otherId == targetId && c.otherRole == targetRole);
                    if (existingConv) {
                        handleSelectChat(existingConv);
                    } else if (targetName) {
                        handleSelectChat({
                            otherId: parseInt(targetId),
                            otherRole: targetRole,
                            otherName: targetName,
                            unreadCount: 0,
                            lastMessage: t('startNewConversation'),
                            lastTimestamp: new Date().toISOString()
                        });
                    }
                } else if (data.length > 0) {
                    handleSelectChat(data[0]);
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [location]);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const results = await api.searchUsers(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
            }
        };
        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (message) => {
            const isCurrentChat = (message.senderId === selectedChat?.otherId && message.senderRole === selectedChat?.otherRole) ||
                (message.receiverId === selectedChat?.otherId && message.receiverRole === selectedChat?.otherRole);

            if (isCurrentChat) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
            refreshConversations();
        };
        socket.on('receive_private_message', handleNewMessage);
        socket.on('message_sent', handleNewMessage);
        return () => {
            socket.off('receive_private_message', handleNewMessage);
            socket.off('message_sent', handleNewMessage);
        };
    }, [socket, selectedChat]);

    const refreshConversations = async () => {
        try {
            const data = await api.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Error refreshing conversations:', error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSelectChat = async (conv) => {
        setSelectedChat(conv);
        setMessages([]);
        setShowSearch(false);
        setSearchQuery('');

        try {
            const history = await api.getChatHistory(conv.otherId, conv.otherRole);
            setMessages(history);
            setConversations(prev => prev.map(c =>
                c.otherId === conv.otherId && c.otherRole === conv.otherRole
                    ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) {
            showToast(t('errorLoadingChatHistory'), 'error');
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !socket) return;

        const messageData = {
            senderId: user.id || user.studentId,
            senderRole: user.role,
            receiverId: selectedChat.otherId,
            receiverRole: selectedChat.otherRole,
            content: newMessage
        };
        socket.emit('send_private_message', messageData);
        setNewMessage('');
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="admin-dashboard-container fade-in" style={{ padding: '20px', height: 'calc(100vh - 40px)', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-card" style={{ flex: 1, margin: '0', padding: '0', display: 'flex', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                {/* Sidebar: Conversations */}
                <div style={{ width: '350px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                    <header style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>{t('directMessages')}</h2>
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="admin-btn"
                                style={{ padding: '8px', borderRadius: '10px', background: showSearch ? '#e0f2fe' : '#f1f5f9', color: '#0284c7', border: 'none', boxShadow: 'none' }}
                            >
                                {showSearch ? <Plus style={{ transform: 'rotate(45deg)' }} size={18} /> : <Plus size={18} />}
                            </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder={t('searchMessages')}
                                className="form-input"
                                style={{ width: '100%', padding: '10px 10px 10px 35px', background: '#f1f5f9', borderRadius: '10px', fontSize: '0.9rem', border: 'none' }}
                            />
                        </div>
                    </header>

                    {showSearch && (
                        <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', background: 'white' }} className="fade-in">
                            <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Global Directory</h4>
                            <input
                                type="text"
                                placeholder={t('findSomeone')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.9rem' }}
                            />
                            {searchResults.length > 0 && (
                                <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {searchResults.map(res => (
                                        <div
                                            key={`${res.role}_${res.id}`}
                                            onClick={() => handleSelectChat({
                                                otherId: res.id, otherRole: res.role, otherName: res.name,
                                                unreadCount: 0, lastMessage: t('startNewConversation'), lastTimestamp: new Date().toISOString()
                                            })}
                                            style={{ padding: '8px 12px', cursor: 'pointer', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e2e8f0' }}
                                        >
                                            <div style={{ width: '25px', height: '25px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#0284c7' }}>{res.name.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#1e293b' }}>{res.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>{res.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {conversations.length === 0 ? (
                            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
                                <MessageSquare size={40} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                                <p>{t('noActiveConversations')}</p>
                            </div>
                        ) : (
                            conversations.map((conv, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelectChat(conv)}
                                    style={{
                                        padding: '15px', borderRadius: '15px', cursor: 'pointer', marginBottom: '5px', position: 'relative', overflow: 'hidden',
                                        background: selectedChat?.otherId === conv.otherId ? 'white' : 'transparent',
                                        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '12px',
                                        boxShadow: selectedChat?.otherId === conv.otherId ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        border: selectedChat?.otherId === conv.otherId ? '1px solid #e2e8f0' : '1px solid transparent'
                                    }}
                                >
                                    {selectedChat?.otherId === conv.otherId && <div style={{ position: 'absolute', left: '0', top: '20%', bottom: '20%', width: '3px', background: '#3b82f6', borderRadius: '0 4px 4px 0' }} />}
                                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', color: '#64748b' }}>
                                        {conv.otherName.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>{conv.otherName}</h4>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(conv.lastTimestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: conv.unreadCount > 0 ? '#1e293b' : '#64748b', fontWeight: conv.unreadCount > 0 ? '700' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {conv.lastMessage}
                                        </div>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div style={{ background: '#3b82f6', color: 'white', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <header style={{ padding: '15px 30px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', color: '#64748b' }}>
                                        {selectedChat.otherName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>{selectedChat.otherName}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Encrypted Sync</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="admin-btn" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', color: '#64748b', boxShadow: 'none' }}><Phone size={18} /></button>
                                    <button className="admin-btn" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', color: '#64748b', boxShadow: 'none' }}><Video size={18} /></button>
                                    <button className="admin-btn" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', color: '#64748b', boxShadow: 'none' }}><Info size={18} /></button>
                                </div>
                            </header>

                            {/* Chat Messages */}
                            <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: '#f8fafc' }}>
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === (user.id || user.studentId) && msg.senderRole === user.role;
                                    return (
                                        <div
                                            key={idx}
                                            style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}
                                        >
                                            <div style={{
                                                padding: '12px 18px', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                background: isMe ? '#3b82f6' : 'white',
                                                color: isMe ? 'white' : '#1e293b',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                fontSize: '0.95rem', lineHeight: '1.5', fontWeight: isMe ? '500' : '400', border: isMe ? 'none' : '1px solid #e2e8f0'
                                            }}>
                                                {msg.content}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '5px', padding: '0 5px' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <footer style={{ padding: '20px 30px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <button type="button" className="admin-btn" style={{ background: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '50%', color: '#64748b', boxShadow: 'none' }}><Paperclip size={18} /></button>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder={t('writeYourMessage')}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="form-input"
                                            style={{ width: '100%', padding: '15px 20px', borderRadius: '30px', fontSize: '0.95rem' }}
                                        />
                                        <button type="button" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Smile size={20} /></button>
                                    </div>
                                    <button type="submit" className="admin-btn" style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)', padding: 0 }}>
                                        <Send size={20} />
                                    </button>
                                </form>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', color: '#cbd5e1', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><ShieldCheck size={12} /> End-to-End Encrypted</div>
                                    <div>|</div>
                                    <div>Cloud Synchronized</div>
                                </div>
                            </footer>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <MessageSquare size={60} style={{ opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#475569' }}>{t('selectChatToStart')}</h3>
                            <p style={{ marginTop: '5px', fontSize: '0.9rem' }}>Select a conversation from the directory to begin messaging.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
