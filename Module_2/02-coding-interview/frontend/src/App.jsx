import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import CodeEditor from './components/CodeEditor';
import CodeExecutor from './components/CodeExecutor';
import RoomManager from './components/RoomManager';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('code-update', ({ code: newCode, language: newLanguage }) => {
      setCode(newCode);
      if (newLanguage) {
        setLanguage(newLanguage);
      }
    });

    newSocket.on('language-update', ({ language: newLanguage }) => {
      setLanguage(newLanguage);
    });

    newSocket.on('participants-update', ({ participants: newParticipants }) => {
      setParticipants(newParticipants);
    });

    newSocket.on('error', ({ message }) => {
      alert(`Error: ${message}`);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setRoomId(data.roomId);
      
      if (socket) {
        socket.emit('join-room', { 
          roomId: data.roomId, 
          username: username || 'Host' 
        });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    }
  };

  const joinRoom = (id) => {
    if (!id || id.trim() === '') {
      alert('Please enter a valid room ID');
      return;
    }

    setRoomId(id.trim());
    if (socket) {
      socket.emit('join-room', { 
        roomId: id.trim(), 
        username: username || 'Guest' 
      });
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket && roomId) {
      socket.emit('code-change', { roomId, code: newCode });
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (socket && roomId) {
      socket.emit('language-change', { roomId, language: newLanguage });
    }
  };

  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
    setRoomId(null);
    setCode('');
    setParticipants([]);
  };

  return (
    <div className="app">
      <RoomManager
        roomId={roomId}
        username={username}
        setUsername={setUsername}
        isConnected={isConnected}
        participants={participants}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onLeaveRoom={leaveRoom}
      />
      
      {roomId && (
        <div className="main-content">
          <div className="editor-section">
            <CodeEditor
              code={code}
              language={language}
              onCodeChange={handleCodeChange}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <div className="executor-section">
            <CodeExecutor code={code} language={language} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
