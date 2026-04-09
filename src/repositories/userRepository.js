const pool = require('../config/db');
const User = require('../models/userModel');

class UserRepository {
  async create(userData) {
    const result = await pool.query(
      `INSERT INTO usuarios(nombres, apellidos, correo, password)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [userData.nombres, userData.apellidos, userData.correo, userData.password]
    );
    return result.rows[0];
  }

  async findByEmail(correo) {
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE correo = $1`,
      [correo]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = new UserRepository();