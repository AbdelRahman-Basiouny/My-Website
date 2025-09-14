// server.js (دعم Gmail وأي SMTP مثل Brevo)
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// قراءة / كتابة DB
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

// اختبار السيرفر
app.get('/api', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// محتوى الموقع
app.get('/api/content', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db);
  } catch (err) {
    console.error('Error reading DB:', err);
    res.status(500).json({ error: 'فشل قراءة المحتوى' });
  }
});

// معالجة الرسائل (حفظ + رد سريع + إرسال إيميل في الخلفية)
async function handleMessage(req, res) {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).send('الرجاء إكمال الاسم، البريد، والرسالة.');
    }

    // حفظ الرسالة
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

    // رد سريع للعميل (لا انتظار للإيميل)
    res.send('تم استلام رسالتك. شكرًا لتواصلك.');

    // إرسال الإيميل في الخلفية (لا يوقف الاستجابة للمستخدم)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      (async () => {
        try {
          let transporterConfig;
          if ((process.env.EMAIL_SERVICE || '').toLowerCase() === 'gmail') {
            transporterConfig = {
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
              }
            };
          } else {
            // Generic SMTP (Brevo أو أي مزوّد)
            transporterConfig = {
              host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
              port: parseInt(process.env.EMAIL_PORT || '587', 10),
              secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for 587
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
              },
              // ضبط وقت الاتصال أقل إن لزم (مثلاً 10s)
              connectionTimeout: 10000,
              greetingTimeout: 10000,
              socketTimeout: 10000
            };
          }

          const transporter = nodemailer.createTransport(transporterConfig);

          const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
            subject: `رسالة جديدة من ${name}`,
            text: `اسم: ${name}\nبريد: ${email}\n\n${message}`
          };

          const info = await transporter.sendMail(mailOptions);
          console.log('📩 Email sent:', info && (info.response || info.messageId) );
        } catch (mailErr) {
          console.warn('⚠️ Failed to send email:', mailErr && mailErr.message ? mailErr.message : mailErr);
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

app.post('/api/send-message', handleMessage);
app.post('/api/contact', handleMessage);

// أي طلب آخر يخدم الواجهة
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
