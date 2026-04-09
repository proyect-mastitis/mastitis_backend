// src/routes/animalRoutes.js
const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const upload = require('../config/upload');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/create', verifyToken, upload.single('imagen'), (req, res) =>
  animalController.createAnimal(req, res)
);
router.get('/list', verifyToken, (req, res) => animalController.getAnimals(req, res));
router.put('/update/:id', verifyToken, upload.single('imagen'), (req, res) =>
  animalController.updateAnimal(req, res)
);
router.delete('/delete/:id', verifyToken, (req, res) =>
  animalController.deleteAnimal(req, res)
);

module.exports = router;