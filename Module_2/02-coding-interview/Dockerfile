# Single-container Docker image:
# - Builds the React frontend (Vite) to static assets
# - Runs the Express + Socket.io backend which also serves the built frontend

FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm --prefix backend ci
RUN npm --prefix frontend ci

# Copy source and build frontend
COPY backend ./backend
COPY frontend ./frontend

RUN npm --prefix frontend run build


FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=/app/frontend/dist

# Install backend production deps only
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm --prefix backend ci --omit=dev

# Copy backend code + built frontend
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3000
CMD ["node", "backend/server.js"]

