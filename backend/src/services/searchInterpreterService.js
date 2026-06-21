import { ClaudeClient } from './claudeClient.js';

const SYSTEM_PROMPT = `Sos un asistente que traduce búsquedas de alquileres en
lenguaje natural (en español rioplatense) a filtros estructurados. Devolvé
SIEMPRE solo un JSON, sin texto adicional, sin markdown, con esta forma exacta:

{
  "price_max": number|null,
  "price_min": number|null,
  "rooms_min": number|null,
  "rooms_max": number|null,
  "accepts_pets": true|false|null,
  "neighborhood_hint": string|null,
  "amenities": [string],
  "free_text_summary": string
}

Reglas:
- Si no se menciona algo, ponelo en null (o array vacío para amenities).
- "amenities" solo puede contener: balcon, cochera, pileta, parrilla, terraza,
  lavadero, aire_acondicionado, amueblado, seguridad_24hs, gimnasio. Ignorá
  cualquier mención que no matchee con esta lista.
- "neighborhood_hint" es el barrio o zona mencionada, tal cual la persona la
  escribió (no la traduzcas ni la corrijas), o null si no mencionó ninguna.
- "free_text_summary" es un resumen de una frase de qué está buscando la
  persona, en tono natural, para usar después al explicar por qué un
  resultado encaja.
- Si dice "hasta X" o "menos de X" es price_max. Si dice "más de X" es
  price_min. Si da un rango, completá ambos.
- "2 ambientes" o "depto de 2" es rooms_min: 2, rooms_max: 2 (a menos que
  diga "2 o más", en ese caso rooms_max queda null).`;

export const SearchInterpreterService = {
  async parseQuery(naturalLanguageQuery) {
    return ClaudeClient.askForJson({
      system: SYSTEM_PROMPT,
      prompt: naturalLanguageQuery,
      maxTokens: 512,
    });
  },
};
