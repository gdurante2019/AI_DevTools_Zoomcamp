# Coding Interview Platform

A real-time collaborative coding interview platform built with React, Vite, Express.js, and Socket.io.

## Features

- ✅ Create a link and share it with candidates
- ✅ Allow everyone who connects to edit code in the code panel
- ✅ Show real-time updates to all connected users
- ✅ Support syntax highlighting for multiple languages (JavaScript, Python, Java, C++, C#, TypeScript, Go, Rust, PHP, Ruby)
- ✅ Execute code safely in the browser (JavaScript/TypeScript)

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Express.js
- **Real-time Communication**: Socket.io
- **Code Editor**: Monaco Editor (VS Code editor)
- **Code Execution**: Browser-based JavaScript execution

## Project Structure

```
02-coding-interview/
├── backend/
│   ├── server.js          # Express server with Socket.io
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── CodeExecutor.jsx
│   │   │   └── RoomManager.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend server will run on `http://localhost:3000` by default.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` by default.

## Usage

1. **Start both servers** (backend and frontend)

2. **Create a Room**:
   - Open the application in your browser
   - Click "Create New Room"
   - A unique room ID will be generated

3. **Share the Room**:
   - Click "Copy Link" to get a shareable URL
   - Send the link to candidates/interviewers

4. **Join a Room**:
   - Click "Join Room"
   - Enter the room ID or use the shared link
   - All participants will see real-time code updates

5. **Code Collaboration**:
   - Type code in the editor
   - Changes are synchronized in real-time to all participants
   - Select different programming languages from the dropdown

6. **Execute Code**:
   - Click "Run Code" to execute JavaScript/TypeScript code
   - Output will appear in the right panel
   - Note: Only JavaScript/TypeScript execution is supported in the browser for safety

## Environment Variables

You can set the following environment variables:

- `PORT`: Backend server port (default: 3000)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)
- `VITE_BACKEND_URL`: Backend URL for frontend (default: http://localhost:3000)

## Code Execution Safety

The platform currently supports browser-based execution for JavaScript/TypeScript only. This is done safely using:
- Function constructor with limited scope
- Console output capture
- Error handling

For other languages (Python, Java, etc.), you would need a backend service with proper sandboxing (e.g., Docker containers, isolated execution environments).

## Future Enhancements

- Backend code execution service with sandboxing for all languages
- User authentication
- Code history/versioning
- Chat functionality
- Screen sharing
- Video/audio integration
- Code templates for common interview problems
- Test case execution

## License

ISC
