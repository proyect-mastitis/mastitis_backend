const userService = require('../services/userService');

class UserController {
  async register(req, res) {
    try {
      const user = await userService.register(req.body);
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          correo: user.correo,
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const result = await userService.login(req.body.correo, req.body.password);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new UserController();