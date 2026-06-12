# ---- Build stage ----
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* values are baked into the frontend bundle at build time.
# VITE_API_BASE_URL is intentionally NOT set for the web build: the frontend
# is served by the same Express server, so relative API URLs are correct.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ---- Runtime stage ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Cloud Run injects $PORT (defaults to 8080); server.ts reads it.
EXPOSE 8080
CMD ["node", "dist/server.cjs"]
