-- 003: crea la tabla ADMINISTRADOR.

-- Un administrador primero debe existir como usuario.
CREATE TABLE admin.administrador (
    correo_usuario  VARCHAR(255)  PRIMARY KEY
        REFERENCES usuarios.usuario (correo) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
);

-- Solo puede existir una cuenta de administrador.
CREATE UNIQUE INDEX ux_administrador_unico ON admin.administrador ((true));
