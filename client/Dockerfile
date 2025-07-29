FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

# Optional: ngrok for tunnel (if needed by Expo CLI)
RUN npm install -g @expo/ngrok

COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--tunnel", "--web"]
