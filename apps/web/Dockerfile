FROM node:20-alpine

WORKDIR /app

COPY package.json /app/package.json

# ✅ 빌드 단계에서는 devDependencies 필요
RUN npm install

COPY . /app
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
