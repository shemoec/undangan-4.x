const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIG ===
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:8080';

// Archivos JSON para guardar datos de forma simple
const dataDir = path.join(__dirname, 'data');
const commentsFile = path.join(dataDir, 'comments.json');
const rsvpFile = path.join(dataDir, 'rsvp.json');

// Crear carpeta y archivos si no existen
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(commentsFile)) fs.writeFileSync(commentsFile, '[]');
if (!fs.existsSync(rsvpFile)) fs.writeFileSync(rsvpFile, '[]');

// Helpers para leer/guardar
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// === ENDPOINTS COMENTARIOS ===

// Obtener comentarios
app.get('/api/comments', (req, res) => {
  const comments = readJson(commentsFile);
  res.json(comments);
});

// Crear comentario nuevo
app.post('/api/comments', (req, res) => {
  const { name, presence, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: 'Faltan datos.' });
  }

  const comments = readJson(commentsFile);
  const newComment = {
    id: uuidv4(),
    name,
    presence, // 0,1,2 si quieres seguir guardándolo
    message,
    likes: 0,                 // 👈 NUEVO
    createdAt: new Date().toISOString(),
  };

  comments.unshift(newComment);
  writeJson(commentsFile, comments);

  res.status(201).json(newComment);
});

// Sumar like a un comentario
app.post('/api/comments/:id/like', (req, res) => {
  const { id } = req.params;
  const comments = readJson(commentsFile);
  const index = comments.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Comentario no encontrado' });
  }

  if (typeof comments[index].likes !== 'number') {
    comments[index].likes = 0;
  }

  comments[index].likes += 1;
  writeJson(commentsFile, comments);

  res.json({ id, likes: comments[index].likes });
});

// Editar comentario (por ahora solo mensaje y name)
app.put('/api/comments/:id', (req, res) => {
  const { id } = req.params;
  const { name, message } = req.body;

  const comments = readJson(commentsFile);
  const index = comments.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Comentario no encontrado' });
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    comments[index].message = message.trim();
  }

  if (typeof name === 'string' && name.trim().length > 0) {
    comments[index].name = name.trim();
  }

  writeJson(commentsFile, comments);
  res.json(comments[index]);
});

// Eliminar comentario
app.delete('/api/comments/:id', (req, res) => {
  const { id } = req.params;
  const comments = readJson(commentsFile);
  const index = comments.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Comentario no encontrado' });
  }

  const removed = comments.splice(index, 1)[0];
  writeJson(commentsFile, comments);

  res.json({ deleted: true, id: removed.id });
});


// === ENDPOINTS RSVP (confirmación) ===

app.get('/api/rsvp', (req, res) => {
  const rsvp = readJson(rsvpFile);
  res.json(rsvp);
});

app.post('/api/rsvp', (req, res) => {
  const { name, presence, guests } = req.body;
  if (!name || typeof presence === 'undefined') {
    return res.status(400).json({ error: 'Faltan datos.' });
  }

  const rsvps = readJson(rsvpFile);
  const newRsvp = {
    id: uuidv4(),
    name,
    presence,      // 1 viene, 2 no viene
    guests: guests || 1,
    createdAt: new Date().toISOString(),
  };

  rsvps.unshift(newRsvp);
  writeJson(rsvpFile, rsvps);

  res.status(201).json(newRsvp);
});

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});

app.post('/api/rsvp', (req, res) => {
  const { name, presence, guests } = req.body;
  if (!name || typeof presence === 'undefined') {
    return res.status(400).json({ error: 'Faltan datos.' });
  }

  const rsvps = readJson(rsvpFile);
  const newRsvp = {
    id: uuidv4(),
    name,
    presence,      // 1 viene, 2 no viene
    guests: guests || 1,
    createdAt: new Date().toISOString(),
  };

  rsvps.unshift(newRsvp);
  writeJson(rsvpFile, rsvps);

  res.status(201).json(newRsvp);
});

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});


