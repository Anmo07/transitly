import { useEffect, useRef, useState } from 'react';

/**
 * useSocket Hook
 * Connects to the Express Socket.IO server and listens for live GPS telematics.
 */
export function useSocket(room = 'global') {
  const [telematics, setTelematics] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if socket.io is available on window or load script
    const initSocket = () => {
      if (window.io) {
        const socket = window.io();
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('join', room);
        });

        socket.on('disconnect', () => {
          setConnected(false);
        });

        socket.on('telematics:update', (data) => {
          setTelematics(data);
        });

        socket.on('order:status', (data) => {
          setTelematics(prev => ({ ...prev, ...data }));
        });
      }
    };

    if (window.io) {
      initSocket();
    } else {
      const script = document.createElement('script');
      script.src = '/socket.io/socket.io.js';
      script.onload = initSocket;
      document.body.appendChild(script);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [room]);

  return { connected, telematics };
}
