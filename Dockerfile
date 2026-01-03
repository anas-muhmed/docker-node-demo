# ---------- Build Stage ----------
FROM node:18-alpine AS builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production=false
COPY . .

# ---------- Runtime Stage ----------
FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app ./

EXPOSE 5000
CMD ["node", "server.js"]
