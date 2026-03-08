FROM node:lts-bookworm

WORKDIR /app

# Clone IAMLEGEND
RUN git clone https://github.com/Stanytz378/IAMLEGEND . && \
    npm install

# Fuck (Express) 
RUN echo "const express = require('express'); \
const app = express(); \
const PORT = process.env.PORT || 3000; \
app.get('/', (req, res) => res.send('IAMLEGEND Bot - STANY TZ is alive!')); \
app.get('/health', (req, res) => res.send('OK')); \
app.listen(PORT, () => console.log('✅ Web server running on port ' + PORT));" > web-server.js

EXPOSE 3000

# Fuck tz tanzania (kumamake)
CMD ["sh", "-c", "node web-server.js & npm start"]