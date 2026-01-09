import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        let newSocket;

        if (isAuthenticated && user) {
            // Connect to the backend
            newSocket = io('http://localhost:5000');

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);

                // Join universal broadcast room
                newSocket.emit('join_room', 'broadcast');

                // Join personalized private room for messaging/specific notifications
                newSocket.emit('join_user_room', { id: user.id || user.studentId, role: user.role });

                // Legacy room support (for grades)
                if (user.role === 'student' && user.studentId) {
                    newSocket.emit('join_room', `student_${user.studentId}`);
                } else if (user.role === 'parent') {
                    newSocket.emit('join_room', `parent_${user.id}`);
                }
            });

            // Global notification handler
            newSocket.on('notification', (data) => {
                console.log('Received notification:', data);

                // Show toast notification
                showToast(
                    <div>
                        <strong>{data.title}</strong>
                        <div>{data.message}</div>
                    </div>,
                    data.type === 'warning' ? 'error' : 'info',
                    5000 // duration
                );

                // Play notification sound if available
                try {
                    const audio = new Audio('/notification.mp3');
                    audio.play();
                } catch (e) {
                    // Ignore audio errors
                }
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) {
                console.log('Disconnecting socket...');
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated, user, showToast]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
