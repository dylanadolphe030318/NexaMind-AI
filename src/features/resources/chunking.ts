export const CHUNK_TARGET_LENGTH = 800;
export const CHUNK_OVERLAP = 100;

const MIN_BREAK_RATIO = 0.5;

/** Cherche, dans la fenêtre, la meilleure fin de passage : paragraphe, puis phrase, puis ligne, puis mot. */
function findBreak(text: string, start: number, hardEnd: number): number {
  const windowStart = start + Math.floor((hardEnd - start) * MIN_BREAK_RATIO);
  const window = text.slice(windowStart, hardEnd);
  for (const separator of ["\n\n", ". ", "! ", "? ", "\n", " "]) {
    const index = window.lastIndexOf(separator);
    if (index >= 0) {
      return windowStart + index + separator.length;
    }
  }
  return hardEnd;
}

/**
 * Découpe un texte en passages d'environ CHUNK_TARGET_LENGTH caractères, avec un
 * chevauchement d'environ CHUNK_OVERLAP caractères. Texte vide : aucun passage.
 */
export function chunkText(
  text: string,
  targetLength = CHUNK_TARGET_LENGTH,
  overlap = CHUNK_OVERLAP,
): string[] {
  const source = text.replace(/\r\n?/g, "\n").trim();
  if (!source) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < source.length) {
    const hardEnd = Math.min(start + targetLength, source.length);
    const end = hardEnd === source.length ? hardEnd : findBreak(source, start, hardEnd);
    const chunk = source.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    if (end >= source.length) {
      break;
    }

    // Le chevauchement repart au début d'un mot pour ne pas couper un mot en deux.
    let next = Math.max(end - overlap, start + 1);
    const nextSpace = source.indexOf(" ", next);
    if (next > start + 1 && nextSpace !== -1 && nextSpace < end) {
      next = nextSpace + 1;
    }
    start = next;
  }
  return chunks;
}
