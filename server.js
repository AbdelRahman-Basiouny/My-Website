// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'database.json');

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database helper
async function readDB() {
  try {
    const txt = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(txt || '{}');
  } catch (err) {
    if (err.code === 'ENOENT') {
      const init = { sections: [], skills: [], projects: [], messages: [] };
      await fs.writeFile(DB_PATH, JSON.stringify(init, null, 2), 'utf8');
      return init;
    }
    throw err;
  }
}
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Routes
app.get('/api', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/content', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db);
  } catch (err) {
    res.status(500).json({ error: 'فشل قراءة المحتوى' });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).send('الرجاء إكمال جميع الحقول.');
    }

    const db = await readDB();
    db.messages.push({
      id: Date.now(),
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    });
    await writeDB(db);

    // Email sending (Brevo)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
          subject: `📩 رسالة جديدة من ${name}`,
          text: `الاسم: ${name}\nالبريد: ${email}\n\n${message}`,
        });

        console.log('✅ Email sent successfully');
      } catch (mailErr) {
        console.warn('⚠️ Failed to send email:', mailErr.message);
      }
    }

    res.send('تم استلام رسالتك. شكرًا لتواصلك.');
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ أثناء معالجة الرسالة.');
  }
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
