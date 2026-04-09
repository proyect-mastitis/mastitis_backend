class User {
  constructor(id, nombres, apellidos, correo, password, createdAt = null) {
    this.id = id;
    this.nombres = nombres;
    this.apellidos = apellidos;
    this.correo = correo;
    this.password = password;
    this.createdAt = createdAt || new Date();
  }
}

module.exports = User;