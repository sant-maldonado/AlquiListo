import { ClaudeClient } from './claudeClient.js';

const SYSTEM_PROMPT = `Sos un asistente que ayuda a ordenar propiedades de
alquiler según qué tan bien encajan con lo que la persona busca. Te paso lo
que la persona escribió y una lista de propiedades candidatas (ya filtradas
por precio/ambientes/zona). Tu trabajo es ordenarlas de mejor a peor match y
agregar una razón corta de por qué cada una encaja.

Devolvé SIEMPRE solo un JSON, sin texto adicional, sin markdown, con esta
forma exacta:

{
  "ranked": [
    { "property_id": string, "match_reason": string }
  ]
}

Reglas:
- "ranked" tiene que incluir TODOS los ids que te pasé, sin inventar ni
  omitir ninguno, ordenados del mejor al peor match.
- "match_reason" es una frase corta (máximo 15 palabras), en tono natural,
  explicando concretamente por qué esa propiedad encaja con la búsqueda
  (ej: "Tiene balcón y está a pasos del centro, como pediste").
- Si una propiedad no tiene ninguna razón fuerte, igual incluila al final
  con una razón honesta y breve (ej: "Cumple con el presupuesto, aunque no
  está exactamente en la zona que buscás").`;

export const SearchRankingService = {
  async rank({ query, properties }) {
    if (properties.length === 0) return [];

    const candidatesPayload = properties.map((p) => ({
      property_id: p.id,
      title: p.title,
      price: p.price,
      rooms: p.rooms,
      neighborhood: p.neighborhood,
      address: p.address,
      accepts_pets: p.accepts_pets,
      amenities: p.amenities || [],
    }));

    const prompt = `Búsqueda de la persona: "${query}"\n\nPropiedades candidatas:\n${JSON.stringify(candidatesPayload, null, 2)}`;

    const result = await ClaudeClient.askForJson({
      system: SYSTEM_PROMPT,
      prompt,
      maxTokens: 2048,
    });

    return result.ranked || [];
  },
};
