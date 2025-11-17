process.on('uncaughtException', (err) => {
    console.error('ERROR FATAL NO CAPTURADO: ', err);
    process.exit(1); // Esto forzará la impresión del error en los logs de Render
});

// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== CONEXIÓN A MONGODB ATLAS ======
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ ERROR: falta la variable de entorno MONGODB_URI');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

// ====== ESQUEMAS Y MODELOS ======
const commentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  presence: String, // "1", "2" o "0"
  message: String,
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const rsvpSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  presence: String, // "1" asiste, "2" no asiste
  guests: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model('Comment', commentSchema);
const Rsvp = mongoose.model('Rsvp', rsvpSchema);

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());

// servir archivos estáticos (index.html, dashboard.html, css, js, assets, etc.)
app.use(express.static(path.join(__dirname, '..')));


// ====== ENDPOINTS COMMENTS ======

// GET /api/comments  -> lista de comentarios (ordenados por fecha desc)
app.get('/api/comments', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 }).lean();
    res.json(comments);
  } catch (err) {
    console.error('Error al obtener comentarios:', err);
    res.status(500).json({ error: 'Error obteniendo comentarios' });
  }
});

// POST /api/comments  -> crear nuevo comentario
app.post('/api/comments', async (req, res) => {
  try {
    const { name, presence, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ error: 'Faltan nombre o mensaje.' });
    }

    const comment = await Comment.create({
      name,
      presence: presence ?? "0",
      message,
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error al crear comentario:', err);
    res.status(500).json({ error: 'Error creando comentario' });
  }
});

// PUT /api/comments/:id  -> editar comentario
app.put('/api/comments/:id', async (req, res) => {
  try {
    const { message, name } = req.body;
    const { id } = req.params;

    const updated = await Comment.findOneAndUpdate(
      { id },
      { message, name },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar comentario:', err);
    res.status(500).json({ error: 'Error actualizando comentario' });
  }
});

// DELETE /api/comments/:id  -> borrar comentario
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Comment.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error al eliminar comentario:', err);
    res.status(500).json({ error: 'Error eliminando comentario' });
  }
});

// ====== ENDPOINTS RSVP ======

// GET /api/rsvp  -> lista todos los RSVP
app.get('/api/rsvp', async (req, res) => {
  try {
    const rsvps = await Rsvp.find().sort({ createdAt: -1 }).lean();
    res.json(rsvps);
  } catch (err) {
    console.error('Error al obtener RSVP:', err);
    res.status(500).json({ error: 'Error obteniendo RSVP' });
  }
});

// POST /api/rsvp  -> crear/registrar RSVP
app.post('/api/rsvp', async (req, res) => {
  try {
    const { name, presence, guests } = req.body;

    if (!name || typeof presence === 'undefined') {
      return res.status(400).json({ error: 'Faltan datos.' });
    }

    const guestsNumber = Number.isFinite(+guests) && +guests > 0 ? +guests : 1;

    const rsvp = await Rsvp.create({
      name,
      presence,
      guests: guestsNumber,
    });

    res.status(201).json(rsvp);
  } catch (err) {
    console.error('Error al guardar RSVP:', err);
    res.status(500).json({ error: 'Error guardando RSVP' });
  }
});

// ====== INICIAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
});
