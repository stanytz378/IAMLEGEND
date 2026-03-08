import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Simple status page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>IAMLEGEND Bot</title>
      <style>
        body { background: #0a0a12; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.05); border-radius: 20px; padding: 40px; text-align: center; border: 1px solid #00ff88; }
        h1 { color: #00ff88; }
        p { color: #ccc; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🤖 IAMLEGEND BOT</h1>
        <p>Bot is running successfully!</p>
        <p>© STANY TZ 2026</p>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});