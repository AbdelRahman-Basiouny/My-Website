// server.js (مبسط للتجربة على Railway)
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// دالة لقراءة قاعدة البيانات
async function readDB() {
  try {
    const txt = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(txt || '{}');
  } catch {
    return { sections: [], skills: [], projects: [], messages: [] };
  }
}

// Route: صحة السيرفر
app.get('/api', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Route: محتوى الموقع
app.get('/api/content', async (req, res) => {
  const db = await readDB();
  res.json(db);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
