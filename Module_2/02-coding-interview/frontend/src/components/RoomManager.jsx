import { useState, useEffect } from 'react';
import './RoomManager.css';

function RoomManager({
  roomId,
  username,
  setUsername,
  isConnected,
  participants,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const copyRoomLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Room link copied to clipboard!');
    });
  };

  // Check for room ID in URL on mount
  useEffect(() => {
    if (roomId) return; // Don't auto-join if already in a room
    
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomId(roomParam);
      setShowJoinForm(true);
      // Auto-join if room ID is in URL
      onJoinRoom(roomParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="room-manager">
      <div className="room-manager-header">
        <h1>💻 Coding Interview Platform</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {!roomId ? (
        <div className="room-setup">
          <div className="username-input">
            <label htmlFor="username">Your Name (optional):</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="room-actions">
            <button onClick={onCreateRoom} className="btn btn-primary">
              Create New Room
            </button>
            <button 
              onClick={() => setShowJoinForm(!showJoinForm)} 
              className="btn btn-secondary"
            >
              {showJoinForm ? 'Cancel' : 'Join Room'}
            </button>
          </div>

          {showJoinForm && (
            <div className="join-room-form">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onJoinRoom(joinRoomId);
                  }
                }}
              />
              <button onClick={() => onJoinRoom(joinRoomId)} className="btn btn-primary">
                Join
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="room-info">
          <div className="room-details">
            <div>
              <strong>Room ID:</strong> <span className="room-id">{roomId}</span>
            </div>
            <div>
              <strong>Participants:</strong> {participants.length}
            </div>
            <div className="participant-list">
              {participants.map((p) => (
                <span key={p.id} className="participant-tag">
                  {p.username || 'Anonymous'}
                </span>
              ))}
            </div>
          </div>
          <div className="room-actions">
            <button onClick={copyRoomLink} className="btn btn-secondary">
              📋 Copy Link
            </button>
            <button onClick={onLeaveRoom} className="btn btn-danger">
              Leave Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomManager;
