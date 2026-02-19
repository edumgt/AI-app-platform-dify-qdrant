FROM node:20-alpine

WORKDIR /app

# 루트 컨텍스트 기준 경로
COPY apps/api/package.json /app/package.json
RUN npm install --omit=dev

COPY apps/api/src /app/src
COPY db /app/db

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/server.js"]
