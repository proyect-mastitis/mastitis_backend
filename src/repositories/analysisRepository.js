const pool = require('../config/db');
const Analysis = require('../models/analysisModel');

class AnalysisRepository {
  /**
   * ✅ Crear análisis SOLO si todas las imágenes son válidas
   * @param {Analysis} analysisData - Datos del análisis
   * @returns {Promise<Object>} Análisis guardado
   */
  async create(analysisData) {
    try {
      const result = await pool.query(
        `INSERT INTO analisis(
          animal_id, 
          resultado, 
          confianza, 
          imagenes, 
          is_valid,
          mastitis_detected,
          valid_count,
          total_uploaded,
          fecha
        )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          analysisData.animal_id,
          analysisData.resultado,
          analysisData.confianza,
          JSON.stringify(analysisData.imagenes), // ✅ Array de detalles
          analysisData.is_valid,
          analysisData.mastitis_detected || false,
          analysisData.valid_count || 0,
          analysisData.total_uploaded || 0,
          analysisData.fecha || new Date(),
        ]
      );

      const row = result.rows[0];
      return this._formatAnalysis(row);
    } catch (error) {
      console.error('❌ Error en create:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Obtener todos los análisis de un animal (válidos)
   * @param {string} animal_id - ID del animal
   * @returns {Promise<Array>} Lista de análisis
   */
  async findByAnimalId(animal_id) {
    try {
      const result = await pool.query(
        `SELECT 
          id, 
          animal_id, 
          resultado, 
          confianza, 
          imagenes, 
          is_valid,
          mastitis_detected,
          valid_count,
          total_uploaded,
          fecha
         FROM analisis 
         WHERE animal_id=$1 AND is_valid=TRUE 
         ORDER BY fecha DESC`,
        [animal_id]
      );

      return result.rows.map(row => this._formatAnalysis(row));
    } catch (error) {
      console.error('❌ Error en findByAnimalId:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 Obtener un análisis por ID
   * @param {string} id - ID del análisis
   * @returns {Promise<Object|null>} Análisis o null
   */
  async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM analisis WHERE id=$1 AND is_valid=TRUE`,
        [id]
      );

      if (!result.rows[0]) return null;
      return this._formatAnalysis(result.rows[0]);
    } catch (error) {
      console.error('❌ Error en findById:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 Obtener análisis filtrados
   * @param {string} animal_id - ID del animal
   * @param {Object} filters - Filtros (status, search)
   * @returns {Promise<Array>} Lista filtrada
   */
  async findFiltered(animal_id, filters) {
    try {
      let query = `SELECT * FROM analisis WHERE animal_id=$1 AND is_valid=TRUE`;
      const params = [animal_id];
      let paramCount = 2;

      // Filtro por estado (Con mastitis / Sin mastitis)
      if (filters.status && filters.status !== "Todos" && filters.status.trim() !== "") {
        query += ` AND resultado ILIKE $${paramCount}`;
        params.push(`%${filters.status.trim()}%`);
        paramCount++;
      }

      // Búsqueda por ID del animal
      if (filters.search && filters.search.trim() !== "") {
        query += ` AND (animal_id::text ILIKE $${paramCount})`;
        params.push(`%${filters.search.trim()}%`);
        paramCount++;
      }

      query += ` ORDER BY fecha DESC`;

      const result = await pool.query(query, params);
      return result.rows.map(row => this._formatAnalysis(row));
    } catch (error) {
      console.error('❌ Error en findFiltered:', error.message);
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar análisis
   * @param {string} id - ID del análisis
   * @returns {Promise<Object|null>} Análisis eliminado o null
   */
  async delete(id) {
    try {
      const result = await pool.query(
        `DELETE FROM analisis WHERE id=$1 RETURNING *`,
        [id]
      );

      if (!result.rows[0]) return null;
      return this._formatAnalysis(result.rows[0]);
    } catch (error) {
      console.error('❌ Error en delete:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 Obtener todas los análisis (sin filtro)
   * @returns {Promise<Array>} Lista de todos los análisis
   */
  async findAll() {
    try {
      const result = await pool.query(
        `SELECT * FROM analisis WHERE is_valid=TRUE ORDER BY fecha DESC`
      );

      return result.rows.map(row => this._formatAnalysis(row));
    } catch (error) {
      console.error('❌ Error en findAll:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas de análisis
   * @param {string} animal_id - ID del animal (opcional)
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats(animal_id = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_analysis,
          SUM(CASE WHEN mastitis_detected = TRUE THEN 1 ELSE 0 END) as total_with_mastitis,
          SUM(CASE WHEN mastitis_detected = FALSE THEN 1 ELSE 0 END) as total_without_mastitis,
          AVG(confianza) as avg_confidence
        FROM analisis 
        WHERE is_valid=TRUE
      `;

      const params = [];

      if (animal_id) {
        query += ` AND animal_id=$1`;
        params.push(animal_id);
      }

      const result = await pool.query(query, params);
      const row = result.rows[0];

      return {
        total_analysis: parseInt(row.total_analysis) || 0,
        total_with_mastitis: parseInt(row.total_with_mastitis) || 0,
        total_without_mastitis: parseInt(row.total_without_mastitis) || 0,
        avg_confidence: parseFloat(row.avg_confidence) || 0,
        mastitis_percentage:
          row.total_analysis > 0
            ? ((parseInt(row.total_with_mastitis) / parseInt(row.total_analysis)) * 100).toFixed(2)
            : 0,
      };
    } catch (error) {
      console.error('❌ Error en getStats:', error.message);
      throw error;
    }
  }

  /**
   * 🔧 Helper: Formatear análisis (parsear JSON)
   */
  _formatAnalysis(row) {
    if (!row) return null;

    return {
      id: row.id,
      animal_id: row.animal_id,
      resultado: row.resultado,
      confianza: parseFloat(row.confianza),
      imagenes:
        typeof row.imagenes === 'string'
          ? JSON.parse(row.imagenes)
          : row.imagenes || [],
      is_valid: row.is_valid,
      mastitis_detected: row.mastitis_detected || false,
      valid_count: row.valid_count || 0,
      total_uploaded: row.total_uploaded || 0,
      fecha: row.fecha,
    };
  }
}

module.exports = new AnalysisRepository();