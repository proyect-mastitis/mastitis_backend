const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class UserService {
  async register(userData) {
    const { nombres, apellidos, correo, password } = userData;

    if (!nombres || !apellidos || !correo || !password) {
      throw new Error('Todos los campos son obligatorios');
    }

    if (!correo.includes('@')) {
      throw new Error('Correo inválido');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener mínimo 6 caracteres');
    }

    const existing = await userRepository.findByEmail(correo);
    if (existing) {
      throw new Error('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await userRepository.create({
      nombres,
      apellidos,
      correo,
      password: hashedPassword,
    });
  }

  async login(correo, password) {
    if (!correo || !password) {
      throw new Error('Correo y contraseña son obligatorios');
    }

    if (!correo.includes('@')) {
      throw new Error('Correo inválido');
    }

    const user = await userRepository.findByEmail(correo);

    if (!user) {
      throw new Error('Credenciales incorrectas');
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new Error('Credenciales incorrectas');
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo: user.correo,
      },
      token,
    };
  }
}

module.exports = new UserService();