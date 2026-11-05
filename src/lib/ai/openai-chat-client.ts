export const DEFAULT_OPENAI_CHAT_MODEL = "gpt-6-luna";
export const CHAT_MAX_OUTPUT_TOKENS = 500;
export const CHAT_TIMEOUT_MS = 30_000;

export type ChatMessage = { role: "system" | "user"; content: string };

type ChatResponse = {
  choices?: Array<{ message?: { content?: unknown; refusal?: unknown }; finish_reason?: unknown }>;
};

// Format de réponse imposé au modèle : texte, numéros des passages utilisés, information manquante.
const REPLY_SCHEMA = {
  name: "assistant_reply",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["answer", "sources", "missing"],
    properties: {
      answer: { type: "string" },
      sources: { type: "array", items: { type: "integer" } },
      missing: { type: "boolean" },
    },
  },
} as const;

/** Retourne le texte JSON du modèle. Les erreurs ne contiennent ni la clé ni la question. */
export async function createOpenAIChatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model: string = DEFAULT_OPENAI_CHAT_MODEL,
  request: typeof fetch = fetch,
): Promise<string> {
  if (!apiKey) {
    throw new Error("La variable OPENAI_API_KEY est manquante.");
  }

  const response = await request("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: CHAT_MAX_OUTPUT_TOKENS,
      response_format: { type: "json_schema", json_schema: REPLY_SCHEMA },
    }),
  });

  if (!response.ok) {
    throw new Error(`La génération de la réponse a échoué (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as ChatResponse;
  const choice = payload.choices?.[0];
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") {
    throw new Error("La réponse OpenAI est incomplète ou refusée.");
  }
  return choice.message.content;
}
