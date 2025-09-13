// server.js (معدّل)
// يعتمد على: express, cors, nodemailer
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');

// إعدادات عامة
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// إذا وضعت ملفات الواجهة في مجلد 'public' فسيخدمها الخادم مباشرة
app.use(express.static(path.join(__dirname, 'public')));

// مساعدة: قراءة / كتابة database.json
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

// ---- نقاط النهاية (API) ----

// صحة الخادم
app.get('/api', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// جلب محتوى الموقع (sections, skills, projects, ...)
app.get('/api/content', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db);
  } catch (err) {
    console.error('Error reading DB:', err);
    res.status(500).json({ error: 'فشل قراءة المحتوى' });
  }
});

// دالة مشتركة لمعالجة الرسائل
async function handleMessage(req, res) {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).send('الرجاء إكمال الاسم، البريد، والرسالة.');
    }

    // أحفظ الرسالة في database.json
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

    // ✅ الرد للمستخدم مباشرة
    res.send('تم استلام رسالتك. شكرًا لتواصلك.');

    // ✉️ المحاولة لإرسال الإيميل في الخلفية (async)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      (async () => {
        try {
          const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
            subject: `رسالة جديدة من ${name}`,
            text: `اسم: ${name}\nبريد: ${email}\n\n${message}`
          };

          await transporter.sendMail(mailOptions);
          console.log('Email sent to', mailOptions.to);
        } catch (mailErr) {
          console.warn('Failed to send email:', mailErr.message);
        }
      })();
    } else {
      console.warn('EMAIL_USER / EMAIL_PASS not set — skipping email send.');
    }

  } catch (err) {
    console.error('send-message error:', err);
    res.status(500).send('حدث خطأ أثناء معالجة الرسالة.');
  }
}

// استلام الرسائل (المسارين يشتغلوا)
app.post('/api/send-message', handleMessage);
app.post('/api/contact', handleMessage);

// أي طلب آخر: حاول إرسال index.html (مفيد لو خدمت الواجهة من نفس الخادم)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

// شغّل الخادم
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
