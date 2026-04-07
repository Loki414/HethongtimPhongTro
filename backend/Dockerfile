# Backend API — Node 20 (Debian slim: bcrypt/mysql2 ổn định hơn Alpine)
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
# sequelize-cli: chạy migration trong container (Azure / docker compose)
RUN npm ci --omit=dev && npm install sequelize-cli@6.6.2 --no-save

COPY . .

# Upload ảnh phòng + log runtime (gắn volume trên Azure nếu cần bền)
RUN mkdir -p uploads logs && chown -R node:node /app

USER node

EXPOSE 4000

# Azure Container Apps / App Service inject PORT; mặc định 4000 cho docker run cục bộ
CMD ["node", "src/server.js"]
