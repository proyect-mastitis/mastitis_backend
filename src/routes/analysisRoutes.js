const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const upload = require('../config/upload');
const verifyToken = require('../middlewares/authMiddleware');

/**
 * POST /api/analysis/analyze
 * Subir imágenes y analizar
 */
router.post(
  '/analyze',
  verifyToken,
  upload.array('images', 2),
  (req, res) => analysisController.analyzeAnimal(req, res)
);

/**
 * GET /api/analysis/history/:animal_id
 * Obtener historial completo
 */
router.get(
  '/history/:animal_id',
  verifyToken,
  (req, res) => analysisController.getHistory(req, res)
);

/**
 * GET /api/analysis/history-filtered/:animal_id
 * Obtener historial filtrado
 */
router.get(
  '/history-filtered/:animal_id',
  verifyToken,
  (req, res) => analysisController.getHistoryFiltered(req, res)
);

/**
 * DELETE /api/analysis/analysis/:id
 * Eliminar un análisis
 */
router.delete(
  '/analysis/:id',
  verifyToken,
  (req, res) => analysisController.deleteAnalysis(req, res)
);

module.exports = router;