const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const analysisRepository = require('../repositories/analysisRepository');
const Analysis = require('../models/analysisModel');

// LOCAL - const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://127.0.0.1:8000';
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'https://mastitis-ml.onrender.com';


class AnalysisService {
 async analyzeAnimal(animalId, files) {
  if (!animalId) throw this._createError('animal_id es requerido');
  if (!files || files.length < 1) throw this._createError('Debe subir al menos 1 imagen');
  if (files.length > 2) throw this._createError('Máximo 2 imágenes permitidas');

  const formData = new FormData();
  formData.append('animal_id', animalId);

  for (const file of files) {
    const fileStream = fs.createReadStream(file.path);
    formData.append('files', fileStream, file.originalname);
  }

  try {
    console.log(`📤 Enviando análisis a ${ML_SERVER_URL}/analyze`);

    const response = await axios.post(`${ML_SERVER_URL}/analyze`, formData, {
      headers: formData.getHeaders(),
      timeout: 180000,
    });

    const result = response.data;

    if (!result.is_valid || result.valid_count === 0) {
      throw this._createError(
        result.details?.message || 'Ninguna imagen válida. No se realizó análisis.',
        result.details || []
      );
    }

    console.log(`✅ Análisis completado: ${result.status}`);

    console.log("📦 Image paths from FastAPI:");
    result.details.forEach((d, i) => {
      console.log(`  [${i}] valid=${d.valid}, image_path=${d.image_path}`);
    });

    // ✅ ESPERA a descargar y guardar TODAS las imágenes
    const processedDetails = await Promise.all(
      result.details
        .filter(detail => detail.valid === true)
        .map(async (detail) => {
          let finalImagePath = detail.image_path;

          if (detail.image_path) {
            try {
              const imageFilename = path.basename(detail.image_path);
              const sourceUrl = `${ML_SERVER_URL}${detail.image_path}`;
              const destPath = path.join(__dirname, '../../uploads', imageFilename);

              const uploadsDir = path.join(__dirname, '../../uploads');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              console.log(`📥 Descargando: ${sourceUrl}`);
              const response = await axios.get(sourceUrl, { 
                responseType: 'arraybuffer',
                timeout: 30000
              });
              
              fs.writeFileSync(destPath, response.data);
              console.log(`✅ Guardada: ${destPath}`);

              finalImagePath = `/uploads/${imageFilename}`;
            } catch (err) {
              console.warn(`⚠️ Error: ${err.message}`);
              finalImagePath = detail.image_path;
            }
          }

          return {
            image_position: detail.image_position,
            filename: detail.filename,
            valid: detail.valid,
            status: detail.status,
            mastitis_detected: detail.mastitis_detected,
            confidence: detail.confidence,
            image_path: finalImagePath,
            image_id: detail.image_id,
            image_width: detail.image_width,
            image_height: detail.image_height,
            box: detail.box,
          };
        })
    );

    const analysis = new Analysis(
      null,
      animalId,
      result.status,
      result.confidence,
      processedDetails,
      true,
      result.mastitis_detected || false,
      result.valid_count || 0,
      result.total_uploaded || 0,
      new Date()
    );

    const savedAnalysis = await analysisRepository.create(analysis);

    return {
      id: savedAnalysis.id,
      animal_id: savedAnalysis.animal_id,
      status: savedAnalysis.resultado,
      mastitis_detected: savedAnalysis.mastitis_detected,
      confidence: savedAnalysis.confianza,
      analysis_date: savedAnalysis.fecha,
      is_valid: savedAnalysis.is_valid,
      valid_count: savedAnalysis.valid_count,
      total_uploaded: savedAnalysis.total_uploaded,
      details: savedAnalysis.imagenes,
    };
  } catch (error) {
    console.error('❌ Error en analysisService:', error.message);

    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'object' && detail.message) {
        throw this._createError(detail.message, detail.details || []);
      }
      if (typeof detail === 'string') {
        throw this._createError(detail);
      }
    }

    if (error.code === 'ECONNREFUSED') {
      throw this._createError(
        'No se pudo conectar al servidor de análisis ML. Intenta más tarde.'
      );
    }

    throw error;
  } finally {
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.warn(`⚠️ No se pudo eliminar ${file.path}:`, e.message);
          }
        }
      });
    }
  }
}

  /**
   * 📋 Obtener historial completo de un animal
   */
  async getHistoryByAnimal(animalId) {
    if (!animalId) throw this._createError('animal_id es requerido');
    return await analysisRepository.findByAnimalId(animalId);
  }

  /**
   * 🔍 Obtener historial filtrado
   */
  async getHistoryFiltered(animalId, filters) {
    if (!animalId) throw this._createError('animal_id es requerido');
    return await analysisRepository.findFiltered(animalId, filters);
  }

  /**
   * 🗑️ Eliminar un análisis
   */
  async deleteAnalysis(id) {
    if (!id) throw this._createError('id es requerido');

    const deleted = await analysisRepository.delete(id);

    if (!deleted) throw this._createError('Análisis no encontrado');

    if (deleted.imagenes && Array.isArray(deleted.imagenes)) {
      deleted.imagenes.forEach(detail => {
        if (detail.image_path) {
          const filePath = path.join(
            __dirname,
            '../../uploads',
            path.basename(detail.image_path)
          );
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`🗑️ Imagen eliminada: ${filePath}`);
            } catch (e) {
              console.warn(`⚠️ No se pudo eliminar imagen: ${e.message}`);
            }
          }
        }
      });
    }

    return deleted;
  }
  /**
   * 🔧 Crear error estructurado
   */
   _createError(message, details = null) {
    const error = new Error(
      JSON.stringify({
        message,
        details: Array.isArray(details) ? details : (details || null),
        timestamp: new Date().toISOString(),
      })
    );
    return error;
  }
}

module.exports = new AnalysisService();