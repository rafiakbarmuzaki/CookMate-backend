require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const geminiRoutes = require('./routes/geminiRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Pastikan DB terhubung sebelum request diproses (cached, aman untuk serverless).
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`Gagal konek ke MongoDB Atlas: ${error.message}`);
    res.status(500).json({ message: 'Gagal terhubung ke database.' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CookMate API berjalan.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/gemini', geminiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// Di Vercel app di-export sebagai serverless function; listen hanya untuk lokal.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
}

module.exports = app;
