FROM node:lts-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp && \
    rm -rf /var/lib/apt/lists/*

# Install concurrently globally (to run both web server and bot)
RUN npm install -g concurrently

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

EXPOSE 3000

# Run both web server and bot together
CMD ["concurrently", "node web-server.js", "node index.js"]