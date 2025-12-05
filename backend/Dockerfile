FROM node:18-alpine

WORKDIR /app

# копіюємо package.json та встановлюємо залежності
COPY package*.json ./
RUN npm install --production

# копіюємо весь проєкт
COPY . .

# порт сервера
ENV PORT=5000
EXPOSE 5000

# запуск серверу в продакшені
CMD ["npm", "start"]
