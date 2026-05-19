require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/leads', require('./src/routes/leads.routes'));
app.use('/api/grupos', require('./src/routes/grupos.routes'));
app.use('/api/usuarios', require('./src/routes/usuarios.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CRM Flashback API', timestamp: new Date() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`CRM Flashback API corriendo en http://localhost:${PORT}`);
});
