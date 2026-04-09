require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

//USUARIOS
const userRoutes = require('./src/routes/userRoutes');

app.use('/api/users', userRoutes);

// ANIMALES
const animalRoutes = require('./src/routes/animalRoutes');

app.use('/api/animals', animalRoutes);
// permitir acceso a imágenes
app.use('/uploads', express.static('uploads'));

//

const analysisRoutes = require('./src/routes/analysisRoutes');

app.use('/api/analysis', analysisRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
