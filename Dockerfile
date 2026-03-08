FROM node:lts-bookworm

# Install tzdata and set timezone to Africa/Dodoma
RUN apt-get update && apt-get install -y tzdata && \
    ln -fs /usr/share/zoneinfo/Africa/Dodoma /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set environment variable (optional, but good practice)
ENV TZ=Africa/Dodoma

WORKDIR /app

# Install other system dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp && \
    rm -rf /var/lib/apt/lists/*

# Install concurrently to run both web server and bot
RUN npm install -g concurrently

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

EXPOSE 3000

# Run both web server and bot
CMD ["concurrently", "node web-server.js", "node index.js"]