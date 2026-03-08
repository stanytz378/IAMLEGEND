FROM node:lts-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp && \
    rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (Render inatarajia hii)
EXPOSE 3000

# Start both the web server and the bot using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]