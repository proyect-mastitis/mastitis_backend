class Animal {
  constructor(
    id,
    codigo,
    raza,
    nro_partos,
    fecha_nacimiento,
    descripcion,
    imagen,
    usuario_id,
    createdAt = null
  ) {
    this.id = id;
    this.codigo = codigo;
    this.raza = raza;
    this.nro_partos = nro_partos;
    this.fecha_nacimiento = fecha_nacimiento;
    this.descripcion = descripcion;
    this.imagen = imagen;
    this.usuario_id = usuario_id;
    this.createdAt = createdAt || new Date();
  }
}

module.exports = Animal;