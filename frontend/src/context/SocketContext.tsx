import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    onlineUsers: string[];
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    onlineUsers: [],
    joinRoom: () => {},
    leaveRoom: () => {},
});

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(() => {
        if (user && token) {
            const newSocket = io(SOCKET_URL, {
                withCredentials: true,
                auth: { token }
            });

            setSocket(newSocket);

            newSocket.emit("register", user.id);

            newSocket.on("online_users", (users: string[]) => {
                setOnlineUsers(users);
            });

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setOnlineUsers([]);
            }
        }
    }, [user]);

    /** Join a socket room (e.g., courseId for live classroom or syllabus page) */
    const joinRoom = useCallback((roomId: string) => {
        if (socket && roomId) {
            socket.emit('join_room', { roomId });
        }
    }, [socket]);

    /** Leave a socket room */
    const leaveRoom = useCallback((roomId: string) => {
        if (socket && roomId) {
            socket.emit('leave_room', { roomId });
        }
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, joinRoom, leaveRoom }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
