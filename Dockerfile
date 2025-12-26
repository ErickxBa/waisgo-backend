# ======================
# STAGE 1: BUILD
# ======================
FROM node:20-slim AS builder

WORKDIR /app

# Update OS packages to reduce known vulnerabilities and install build tools needed for native modules
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends ca-certificates build-essential python3 g++ make && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ======================
# STAGE 2: PRODUCTION
# ======================
# Use the newer slim image and proactively update OS packages to fix known vulnerabilities
FROM node:20-slim

WORKDIR /app

# Ensure OS packages are up-to-date to reduce vulnerabilities
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root (SEGURIDAD) - Sintaxis correcta para Debian
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

# Copiar solo lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
