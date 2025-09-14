const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function readDB() {
  try {
    const txt = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(txt || '{}');
  } catch {
    return { sections: [], skills: [], projects: [], messages: [] };
  }
}

// صحة السيرفر
app.get('/api', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// محتوى الموقع
app.get('/api/content', async (req, res) => {
  const db = await readDB();
  res.json(db);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
