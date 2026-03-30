/**
 * Algoritmo de imposicion saddle-stitch para booklets.
 *
 * Calcula el orden de paginas para imprimir un cuadernillo que se
 * dobla por la mitad y se engrapa al centro. Cada hoja fisica tiene
 * frente y reverso, cada lado con dos paginas (izquierda y derecha).
 *
 * Numeros de pagina son 1-based. El valor 0 indica pagina en blanco
 * (padding para que el total sea multiplo de 4).
 */

/** Lado de una hoja fisica: dos paginas (izquierda y derecha) */
export interface SheetSide {
  left: number;  // 1-based page number, 0 = blank
  right: number;
}

/** Hoja fisica con frente y reverso */
export interface ImpositionSheet {
  front: SheetSide;
  back: SheetSide;
}

/**
 * Calcula el orden de imposicion saddle-stitch para un numero dado de paginas de contenido.
 *
 * @param totalContentPages - Numero de paginas con contenido (>0)
 * @returns Array de hojas fisicas con el orden de paginas para imprimir
 */
export function computeImposition(totalContentPages: number): ImpositionSheet[] {
  if (totalContentPages <= 0) return [];

  // Redondear al multiplo de 4 mas cercano hacia arriba
  const totalPages = Math.ceil(totalContentPages / 4) * 4;
  const numSheets = totalPages / 4;
  const sheets: ImpositionSheet[] = [];

  for (let i = 0; i < numSheets; i++) {
    const frontLeft = totalPages - 2 * i;
    const frontRight = 2 * i + 1;
    const backLeft = 2 * i + 2;
    const backRight = totalPages - 2 * i - 1;

    sheets.push({
      front: {
        left: frontLeft > totalContentPages ? 0 : frontLeft,
        right: frontRight > totalContentPages ? 0 : frontRight,
      },
      back: {
        left: backLeft > totalContentPages ? 0 : backLeft,
        right: backRight > totalContentPages ? 0 : backRight,
      },
    });
  }

  return sheets;
}
