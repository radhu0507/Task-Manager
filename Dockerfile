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
CMD ["sh", "-c", "echo '== running prisma migrate =='; ./node_modules/.bin/prisma migrate deploy; echo \"migrate exit=$?\"; echo '== starting node =='; ls -la dist; exec node dist/index.js"]