/**
 * Reglas del nombre, la familia, el proveedor y la imagen; las comparten
 * crear y editar para que den los mismos mensajes.
 */

// Tamaños de las columnas de catalogo.producto
export const LIMITES_DE_TEXTO = Object.freeze({
  sku: 50,
  nombre: 200,
  categoria: 100,
  proveedor: 150,
  imagenUrl: 500,
});

export function problemaDelNombre(nombre) {
  if (!nombre) return "El nombre es obligatorio.";
  if (nombre.length > LIMITES_DE_TEXTO.nombre) return `El nombre no puede pasar de ${LIMITES_DE_TEXTO.nombre} caracteres.`;
  return null;
}

export function problemaDeLaCategoria(categoria) {
  if (!categoria) return "La categoría es obligatoria.";
  if (categoria.length > LIMITES_DE_TEXTO.categoria) {
    return `La categoría no puede pasar de ${LIMITES_DE_TEXTO.categoria} caracteres.`;
  }
  return null;
}

export function problemaDelProveedor(proveedor) {
  if (proveedor && proveedor.length > LIMITES_DE_TEXTO.proveedor) {
    return `El proveedor no puede pasar de ${LIMITES_DE_TEXTO.proveedor} caracteres.`;
  }
  return null;
}

export function problemaDeLaImagen(imagenUrl) {
  if (imagenUrl && (!esUrlWeb(imagenUrl) || imagenUrl.length > LIMITES_DE_TEXTO.imagenUrl)) {
    return "La imagen tiene que ser una dirección web (http o https).";
  }
  return null;
}

function esUrlWeb(valor) {
  try {
    const { protocol } = new URL(valor);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
