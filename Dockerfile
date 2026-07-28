# --- Etapa 1: build del frontend + verificación de tipos ---
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: imagen de producción, solo lo necesario para correr ---
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server ./server

# La base SQLite vive acá — en Fly.io este directorio se monta como volumen persistente.
RUN mkdir -p /app/server/data

EXPOSE 4000

CMD ["node", "server/index.js"]
