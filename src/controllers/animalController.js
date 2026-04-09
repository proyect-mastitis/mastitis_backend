// src/controllers/animalController.js
const animalService = require('../services/animalService');

class AnimalController {
  async createAnimal(req, res) {
    try {
      if (!req.file) {
        throw new Error('La imagen del animal es obligatoria');
      }
      const imagen = req.file.filename;

      const animal = await animalService.createAnimal(
        {
          codigo: req.body.codigo,
          raza: req.body.raza,
          nro_partos: parseInt(req.body.nro_partos),
          fecha_nacimiento: req.body.fecha_nacimiento,
          descripcion: req.body.descripcion,
          imagen: imagen,
        },
        req.user.id
      );

      res.status(201).json({
        message: 'Animal registrado exitosamente',
        animal,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnimals(req, res) {
    try {
      const animales = await animalService.getAnimalsByUser(req.user.id);
      res.json(animales);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAnimal(req, res) {
  try {
    const imagen = req.file ? req.file.filename : undefined;

    const animal = await animalService.updateAnimal(
      req.params.id,
      {
        codigo: req.body.codigo,
        raza: req.body.raza,
        nro_partos: parseInt(req.body.nro_partos),
        fecha_nacimiento: req.body.fecha_nacimiento,
        descripcion: req.body.descripcion,
        imagen: imagen,
      },
      req.user.id
    );

    res.json({
      message: 'Animal actualizado exitosamente',
      animal,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

  async deleteAnimal(req, res) {
    try {
      await animalService.deleteAnimal(req.params.id, req.user.id);
      res.json({ message: 'Animal eliminado exitosamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AnimalController();