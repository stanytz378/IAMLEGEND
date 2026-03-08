FROM node:lts-buster

# Set timezone (badala ya kuweka environment variable tu)
ENV TZ=Africa/Dodoma
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install system dependencies muhimu tu
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json na kusakinisha dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

EXPOSE 3000

# Run bot (npm start inatumia node index.js)
CMD ["npm", "start"]