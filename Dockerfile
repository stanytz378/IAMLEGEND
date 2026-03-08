FROM node:lts-bookworm

WORKDIR /app

# Install system dependencies including tzdata
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    tzdata && \
    rm -rf /var/lib/apt/lists/*

# Set timezone environment variable
ENV TZ=Africa/Dodoma

# Install concurrently globally
RUN npm install -g concurrently

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

EXPOSE 3000

# Run both web server and bot
CMD ["concurrently", "node web-server.js", "node index.js"]