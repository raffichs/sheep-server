# Dockerfile
FROM node:18

WORKDIR /app

# Copy package.json and package-lock.json first for better Docker caching
COPY package*.json ./

RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]