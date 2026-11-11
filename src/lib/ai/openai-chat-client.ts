export const DEFAULT_OPENAI_CHAT_MODEL = "gpt-6-luna";
export const CHAT_MAX_OUTPUT_TOKENS = 500;
export const RESOURCE_SELECTION_MAX_OUTPUT_TOKENS = 2048;
export const CHAT_TIMEOUT_MS = 30_000;

export type ChatMessage = { role: "system" | "user"; content: string };

export class OpenAIChatResponseError extends Error {
  readonly code: "refusal" | "length" | "incomplete";

  constructor(
    code: "refusal" | "length" | "incomplete",
    message: string,
  ) {
    super(message);
    this.name = "OpenAIChatResponseError";
    this.code = code;
  }
}

type ChatResponse = {
  choices?: Array<{ message?: { content?: unknown; refusal?: unknown }; finish_reason?: unknown }>;
};

// Format conservé pour les sélections IA des ressources et des passages.
const RESOURCE_SELECTION_SCHEMA = {
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

const ASSISTANT_REPLY_SCHEMA = {
  name: "assistant_claims",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["claims", "missing"],
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "sources"],
          properties: {
            text: { type: "string" },
            sources: { type: "array", items: { type: "integer" } },
          },
        },
      },
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
  options: { maxOutputTokens?: number; responseSchema?: "assistant" | "resource-selection" } = {},
): Promise<string> {
  if (!apiKey) {
    throw new Error("La variable OPENAI_API_KEY est manquante.");
  }
  const maxOutputTokens = options.maxOutputTokens ?? CHAT_MAX_OUTPUT_TOKENS;
  if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 4096) {
    throw new Error("Budget de génération invalide (1 à 4096 tokens).");
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
      max_completion_tokens: maxOutputTokens,
      response_format: {
        type: "json_schema",
        json_schema: options.responseSchema === "assistant"
          ? ASSISTANT_REPLY_SCHEMA
          : RESOURCE_SELECTION_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`La génération de la réponse a échoué (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as ChatResponse;
  const choice = payload.choices?.[0];
  if (choice?.message?.refusal) {
    throw new OpenAIChatResponseError("refusal", "La génération OpenAI a été refusée.");
  }
  if (choice?.finish_reason === "length") {
    throw new OpenAIChatResponseError("length", `La génération OpenAI a atteint la limite de ${maxOutputTokens} tokens (raisonnement inclus).`);
  }
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") {
    throw new OpenAIChatResponseError("incomplete", "La réponse OpenAI est incomplète ou refusée.");
  }
  return choice.message.content;
}
