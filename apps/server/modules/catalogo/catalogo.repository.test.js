import test from "node:test";
import assert from "node:assert/strict";

import { agruparPorCategoria } from "./catalogo.repository.js";

// Filas como las devuelve el SQL de listarCategorias: una por subcategoría.
const fila = (categoria_id, categoria, subcategoria_id, subcategoria, cantidad_de_productos) => ({
  categoria_id,
  categoria,
  subcategoria_id,
  subcategoria,
  cantidad_de_productos,
});

test("RF-02: arma el árbol de categorías con sus subcategorías", () => {
  const categorias = agruparPorCategoria([
    fila(1, "Juegos de cartas (TCG)", 10, "Pokémon", 2),
    fila(1, "Juegos de cartas (TCG)", 11, "Yu-Gi-Oh!", 1),
    fila(2, "Videojuegos", 20, "Nintendo Switch", 3),
  ]);

  assert.deepEqual(categorias, [
    {
      id: 1,
      nombre: "Juegos de cartas (TCG)",
      cantidadDeProductos: 3,
      subcategorias: [
        { id: 10, nombre: "Pokémon", cantidadDeProductos: 2 },
        { id: 11, nombre: "Yu-Gi-Oh!", cantidadDeProductos: 1 },
      ],
    },
    {
      id: 2,
      nombre: "Videojuegos",
      cantidadDeProductos: 3,
      subcategorias: [{ id: 20, nombre: "Nintendo Switch", cantidadDeProductos: 3 }],
    },
  ]);
});

test("una categoría sin subcategorías queda con la lista vacía", () => {
  const [categoria] = agruparPorCategoria([fila(3, "Juguetes", null, null, 0)]);

  assert.deepEqual(categoria, { id: 3, nombre: "Juguetes", cantidadDeProductos: 0, subcategorias: [] });
});
