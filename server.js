// server.js
// يعتمد على: express, cors, nodemailer
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'database.json');

// ======================
// Middleware
// ======================
const allowedOrigins = [
  'http://localhost:3000', // للتجربة محلي
  'http://localhost:8080', // للتجربة محلي
  'https://abdelrahmanbasiouny.netlify.app' // موقعك على Netlify
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// Database helpers
// ======================
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

// ======================
// Routes
// ======================

// صحة السيرفر
app.get('/api', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// جلب محتوى الموقع
app.get('/api/content', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db);
  } catch (err) {
    console.error('Error reading DB:', err);
    res.status(500).json({ error: 'فشل قراءة المحتوى' });
  }
});

// دالة لمعالجة الرسائل
async function handleMessage(req, res) {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).send('الرجاء إكمال الاسم، البريد، والرسالة.');
    }

    // حفظ الرسالة في DB
    const db = await readDB();
    db.messages = db.messages || [];
    const entry = {
      id: Date.now(),
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };
    db.messages.push(entry);
    await writeDB(db);

    // الرد للمستخدم فورًا
    res.send('تم استلام رسالتك. شكرًا لتواصلك.');

    // محاولة إرسال إيميل
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      (async () => {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });

          const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
            subject: `رسالة جديدة من ${name}`,
            text: `اسم: ${name}\nبريد: ${email}\n\n${message}`
          };

          await transporter.sendMail(mailOptions);
          console.log('📧 Email sent to', mailOptions.to);
        } catch (mailErr) {
          console.warn('❌ Failed to send email:', mailErr.message);
        }
      })();
    } else {
      console.warn('⚠️ EMAIL_USER / EMAIL_PASS not set — skipping email send.');
    }

  } catch (err) {
    console.error('send-message error:', err);
    res.status(500).send('حدث خطأ أثناء معالجة الرسالة.');
  }
}

// نقاط النهاية للرسائل
app.post('/api/send-message', handleMessage);
app.post('/api/contact', handleMessage);

// أي طلب غير معروف → رجّع index.html (للـ Frontend)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

// ======================
// تشغيل السيرفر
// ======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
