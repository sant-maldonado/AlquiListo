import fetch from 'node-fetch';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function parseJsonResponse(text) {
  const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

export const ClaudeClient = {
  async askForJson({ system, prompt, maxTokens = 1024 }) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: prompt }],
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
};
