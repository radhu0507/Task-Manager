FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ .
RUN npm run build

FROM node:20-slim AS server-build
WORKDIR /app/server
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json* ./
COPY server/prisma ./prisma/
RUN npm install
COPY server/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/prisma ./server/prisma
COPY --from=server-build /app/server/package.json ./server/package.json
RUN mkdir -p /app/server/uploads
WORKDIR /app/server
ENV PORT=3001
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/index.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"