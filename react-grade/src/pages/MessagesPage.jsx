import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';
import { useToast } from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MessagesPage = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const location = useLocation();
    const { showToast } = useToast();
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

                // Handle deep linking from other pages
                const queryParams = new URLSearchParams(location.search);
                const targetId = queryParams.get('userId');
                const targetRole = queryParams.get('userRole');
                const targetName = queryParams.get('userName');

                if (targetId && targetRole) {
                    const existingConv = data.find(c => c.otherId == targetId && c.otherRole == targetRole);
                    if (existingConv) {
                        handleSelectChat(existingConv);
                    } else if (targetName) {
                        // Create a temporary conversation object for the UI
                        handleSelectChat({
                            otherId: parseInt(targetId),
                            otherRole: targetRole,
                            otherName: targetName,
                            unreadCount: 0,
                            lastMessage: 'Start a new conversation',
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
            // If the message is from/to the currently selected user, add it to chat
            const isCurrentChat = (message.senderId === selectedChat?.otherId && message.senderRole === selectedChat?.otherRole) ||
                (message.receiverId === selectedChat?.otherId && message.receiverRole === selectedChat?.otherRole);

            if (isCurrentChat) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }

            // Refresh conversation list to show latest message and updated counts
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
        setMessages([]); // Clear while loading
        setShowSearch(false);
        setSearchQuery('');

        try {
            const history = await api.getChatHistory(conv.otherId, conv.otherRole);
            setMessages(history);

            // Clear unread count locally for immediate UI update
            setConversations(prev => prev.map(c =>
                c.otherId === conv.otherId && c.otherRole === conv.otherRole
                    ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) {
            showToast('Error loading chat history', 'error');
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
        <div style={{
            height: 'calc(100vh - 120px)',
            margin: '20px',
            backgroundColor: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            overflow: 'hidden'
        }}>
            {/* Sidebar */}
            <div style={{
                width: '350px',
                borderRight: '1px solid #eee',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#1976d2' }}>Direct Messages</h2>
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        style={{
                            backgroundColor: '#e3f2fd',
                            border: 'none',
                            borderRadius: '50%',
                            width: '35px',
                            height: '35px',
                            cursor: 'pointer',
                            color: '#1976d2',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {showSearch ? '×' : '+'}
                    </button>
                </div>

                {showSearch && (
                    <div style={{ padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#f5f5f5' }}>
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '5px',
                                border: '1px solid #ddd'
                            }}
                            autoFocus
                        />
                        {searchResults.length > 0 && (
                            <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                {searchResults.map(res => (
                                    <div
                                        key={`${res.role}_${res.id}`}
                                        onClick={() => handleSelectChat({
                                            otherId: res.id,
                                            otherRole: res.role,
                                            otherName: res.name,
                                            unreadCount: 0,
                                            lastMessage: 'Start a new conversation',
                                            lastTimestamp: new Date().toISOString()
                                        })}
                                        style={{
                                            padding: '10px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: 'white',
                                            borderRadius: '5px',
                                            marginBottom: '5px'
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{res.name}</div>
                                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'capitalize' }}>{res.role}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {conversations.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                            No active conversations.
                        </div>
                    ) : (
                        conversations.map((conv, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleSelectChat(conv)}
                                style={{
                                    padding: '15px 20px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f9f9f9',
                                    backgroundColor: selectedChat?.otherId === conv.otherId ? '#e3f2fd' : 'transparent',
                                    transition: 'background 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px'
                                }}
                            >
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '18px'
                                }}>
                                    {conv.otherName.charAt(0)}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 'bold' }}>{conv.otherName}</div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>
                                            {new Date(conv.lastTimestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#666',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginTop: '2px',
                                        fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal'
                                    }}>
                                        {conv.lastMessage}
                                    </div>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div style={{
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                    }}>
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfc' }}>
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div style={{
                            padding: '15px 25px',
                            backgroundColor: 'white',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {selectedChat.otherName.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{selectedChat.otherName}</div>
                                <div style={{ fontSize: '12px', color: '#4caf50' }}>● Online</div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{
                            flex: 1,
                            padding: '25px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === (user.id || user.studentId) && msg.senderRole === user.role;
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: isMe ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div style={{
                                            padding: '12px 18px',
                                            borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                            backgroundColor: isMe ? '#1976d2' : 'white',
                                            color: isMe ? 'white' : '#333',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            fontSize: '14px',
                                            lineHeight: '1.4'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={handleSendMessage}
                            style={{
                                padding: '20px 25px',
                                backgroundColor: 'white',
                                borderTop: '1px solid #eee',
                                display: 'flex',
                                gap: '15px'
                            }}
                        >
                            <input
                                type="text"
                                placeholder={`Message ${selectedChat.otherName}...`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '25px',
                                    border: '1px solid #ddd',
                                    outline: 'none',
                                    fontSize: '15px'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px'
                                }}
                            >
                                ✈
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '60px', marginBottom: '20px' }}>💬</div>
                        <h3>Select a conversation to start messaging</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
