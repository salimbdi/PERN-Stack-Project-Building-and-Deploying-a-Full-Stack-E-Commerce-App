# --- STAGE 1: Build the SPA (Vite React) ---
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend

COPY frontend/ ./

# Empty API URL means React calls relative paths (/api) on the same domain
ENV VITE_API_URL=
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN npm install --no-audit --no-fund \
  && npm run build

# --- STAGE 2: Compile the API (TypeScript → JavaScript) ---
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app

COPY backend/ ./

RUN npm install --no-audit --no-fund \
  && npm run build

# --- STAGE 3: Production Runtime Image ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy backend compiled JS into ./dist
COPY --from=backend-build /app/dist ./dist

# Copy frontend compiled assets into ./public for Express to serve
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3001
USER node

CMD ["node", "dist/index.js"]