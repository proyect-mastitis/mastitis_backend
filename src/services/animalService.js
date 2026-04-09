const animalRepository = require('../repositories/animalRepository');

class AnimalService {
  async createAnimal(animalData, usuarioId) {
    if (!animalData.codigo) {
      throw new Error('El código del animal es obligatorio');
    }
    if (!animalData.imagen) {
      throw new Error('La imagen del animal es obligatoria');
    }

    return await animalRepository.create({
      ...animalData,
      usuario_id: usuarioId,
    });
  }

  async getAnimalsByUser(usuarioId) {
    if (!usuarioId) {
      throw new Error('usuario_id es requerido');
    }
    return await animalRepository.findByUserId(usuarioId);
  }

  async updateAnimal(id, animalData, usuarioId) {
    if (!id) {
      throw new Error('id es requerido');
    }

    const animal = await animalRepository.findById(id);
    if (!animal) {
      throw new Error('Animal no encontrado');
    }

    if (animal.usuario_id !== usuarioId) {
      throw new Error('No tienes permiso para actualizar este animal');
    }

    return await animalRepository.update(id, animalData, usuarioId);
  }

  async deleteAnimal(id, usuarioId) {
    if (!id) {
      throw new Error('id es requerido');
    }

    const animal = await animalRepository.findById(id);
    if (!animal) {
      throw new Error('Animal no encontrado');
    }

    if (animal.usuario_id !== usuarioId) {
      throw new Error('No tienes permiso para eliminar este animal');
    }

    await animalRepository.delete(id, usuarioId);
  }
}

module.exports = new AnimalService();