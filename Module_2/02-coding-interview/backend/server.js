import { createInterviewServer } from './src/createInterviewServer.js';

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const { start } = createInterviewServer({ frontendUrl: FRONTEND_URL });
start(PORT).then(({ port }) => {
  console.log(`Server running on port ${port}`);
});
