class Analysis {
  constructor(
    id,
    animal_id,
    resultado,
    confianza,
    imagenes,
    is_valid = false,
    mastitis_detected = false,
    valid_count = 0,
    total_uploaded = 0,
    fecha = null
  ) {
    this.id = id;
    this.animal_id = animal_id;
    this.resultado = resultado;
    this.confianza = confianza;
    this.imagenes = imagenes; // ✅ Array de objetos con detalles de cada imagen
    this.is_valid = is_valid; // ✅ ¿El análisis es válido?
    this.mastitis_detected = mastitis_detected; // ✅ ¿Se detectó mastitis?
    this.valid_count = valid_count; // ✅ Cuántas imágenes fueron válidas
    this.total_uploaded = total_uploaded; // ✅ Total de imágenes subidas
    this.fecha = fecha || new Date();
  }
}

module.exports = Analysis;