import { createInterviewServer } from './src/createInterviewServer.js';

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const STATIC_DIR = process.env.STATIC_DIR || null;

const { start } = createInterviewServer({ frontendUrl: FRONTEND_URL, staticDir: STATIC_DIR });
start(PORT).then(({ port }) => {
  console.log(`Server running on port ${port}`);
});
