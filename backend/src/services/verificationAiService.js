import { StorageService } from './storageService.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const AUTO_APPROVE_THRESHOLD = 0.85;

const PROMPTS_BY_TYPE = {
  dni: `Analizá esta imagen de un DNI argentino. Devolvé SOLO un JSON (sin texto
adicional, sin markdown) con esta forma exacta:
{
  "document_looks_valid": true|false,
  "extracted": { "full_name": string|null, "dni_number": string|null, "birth_date": string|null },
  "confidence": number (0 a 1, qué tan seguro estás de que es un DNI auténtico y legible),
  "red_flags": [string]  // lista de cosas sospechosas, vacía si no hay ninguna
}`,

  recibo_sueldo: `Analizá esta imagen de un recibo de sueldo argentino. Devolvé SOLO un JSON
(sin texto adicional, sin markdown) con esta forma exacta:
{
  "document_looks_valid": true|false,
  "extracted": { "employee_name": string|null, "employer_name": string|null, "net_salary": number|null, "period": string|null },
  "confidence": number (0 a 1, qué tan seguro estás de que es un recibo auténtico y legible),
  "red_flags": [string]
}`,

  escritura: `Analizá esta imagen de una escritura o título de propiedad. Devolvé SOLO un
JSON (sin texto adicional, sin markdown) con esta forma exacta:
{
  "document_looks_valid": true|false,
  "extracted": { "owner_name": string|null, "property_address": string|null },
  "confidence": number (0 a 1),
  "red_flags": [string]
}`,

  poliza_caucion: `Analizá esta imagen de una póliza de seguro de caución. Devolvé SOLO un JSON
(sin texto adicional, sin markdown) con esta forma exacta:
{
  "document_looks_valid": true|false,
  "extracted": { "insurer_name": string|null, "policy_number": string|null, "covered_amount": number|null },
  "confidence": number (0 a 1),
  "red_flags": [string]
}`,

  contrato_anterior: `Analizá esta imagen de un contrato de alquiler anterior. Devolvé SOLO un
JSON (sin texto adicional, sin markdown) con esta forma exacta:
{
  "document_looks_valid": true|false,
  "extracted": { "tenant_name": string|null, "address": string|null },
  "confidence": number (0 a 1),
  "red_flags": [string]
}`,

  otro: `Analizá esta imagen de un documento de identidad/respaldo. Devolvé SOLO un
JSON (sin texto adicional, sin markdown) con esta forma exacta:
{
  "document_looks_valid": true|false,
  "extracted": {},
  "confidence": number (0 a 1),
  "red_flags": [string]
}`,
};

function parseJsonResponse(text) {
  const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

export const VerificationAiService = {
  async analyzeDocument({ type, fileUrl }) {
    const prompt = PROMPTS_BY_TYPE[type] || PROMPTS_BY_TYPE.otro;
    const { base64, mimeType } = StorageService.readFileAsBase64(fileUrl);

    if (mimeType === 'application/pdf') {
      return this._callClaude(prompt, { type: 'document', source: { type: 'base64', media_type: mimeType, data: base64 } });
    }

    return this._callClaude(prompt, { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } });
  },

  async _callClaude(promptText, mediaBlock) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [mediaBlock, { type: 'text', text: promptText }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error de la API de Claude (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const textBlock = data.content.find((b) => b.type === 'text');
    if (!textBlock) {
      throw new Error('La respuesta de la IA no contiene texto');
    }

    return parseJsonResponse(textBlock.text);
  },

  decideStatus(aiResult) {
    const hasRedFlags = Array.isArray(aiResult.red_flags) && aiResult.red_flags.length > 0;
    const isConfident = typeof aiResult.confidence === 'number' && aiResult.confidence >= AUTO_APPROVE_THRESHOLD;
    const looksValid = aiResult.document_looks_valid === true;

    if (looksValid && isConfident && !hasRedFlags) {
      return 'auto_approved';
    }
    return 'flagged';
  },
};
