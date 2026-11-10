import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  createOpenAIChatCompletion,
  CHAT_MAX_OUTPUT_TOKENS,
  RESOURCE_SELECTION_MAX_OUTPUT_TOKENS,
  OpenAIChatResponseError,
} from "../src/lib/ai/openai-chat-client.ts";

test("les sélections ont un budget borné distinct de l'assistant, sans réessai caché", async () => {
  const budgets = [];
  const request = async (_url, init) => {
    budgets.push(JSON.parse(init.body).max_completion_tokens);
    return { ok: true, json: async () => ({
      choices: [{ finish_reason: "stop", message: { content: '{"answer":"","sources":[1],"missing":false}' } }],
    }) };
  };
  await createOpenAIChatCompletion([], "test", "model", request);
  await createOpenAIChatCompletion([], "test", "model", request, {
    maxOutputTokens: RESOURCE_SELECTION_MAX_OUTPUT_TOKENS,
  });
  assert.deepEqual(budgets, [500, 2048]);
  assert.equal(CHAT_MAX_OUTPUT_TOKENS, 500);
  for (const budget of [0, -1, 1.5, 4097, NaN]) {
    await assert.rejects(createOpenAIChatCompletion([], "test", "model", request, {
      maxOutputTokens: budget,
    }), /Budget/);
  }
  assert.equal(budgets.length, 2);
});

test("limite et refus sont distingués sans révéler le texte du refus ni retourner un JSON tronqué", async () => {
  let calls = 0;
  for (const [choice, expected] of [
    [{ finish_reason: "length", message: { content: '{"answer":' } }, /limite de 2048 tokens/],
    [{ finish_reason: "stop", message: { refusal: "DONNEE_PRIVEE", content: "{}" } }, /refusée/],
    [{ finish_reason: "content_filter", message: { content: null } }, /incomplète ou refusée/],
  ]) {
    await assert.rejects(createOpenAIChatCompletion([], "SECRET", "model", async () => {
      calls += 1;
      return { ok: true, json: async () => ({ choices: [choice] }) };
    }, { maxOutputTokens: 2048 }), (error) =>
      error instanceof OpenAIChatResponseError &&
      expected.test(error.message) && !/SECRET|DONNEE_PRIVEE/.test(error.message));
  }
  assert.equal(calls, 3);
});

test("seuls les deux appels ressources utilisent le budget sélection", async () => {
  const [chat, search, phrase, assistant] = await Promise.all([
    readFile("src/lib/ai/chat.ts", "utf8"),
    readFile("src/features/resources/semantic-search.ts", "utf8"),
    readFile("src/features/resources/relevant-search-phrase.ts", "utf8"),
    readFile("src/features/assistant/assistant.ts", "utf8"),
  ]);
  assert.match(chat, /generateChatReply[\s\S]*return generateReply\(messages\);/);
  assert.match(chat, /generateResourceSelectionReply[\s\S]*generateReply\(messages, RESOURCE_SELECTION_MAX_OUTPUT_TOKENS\)/);
  assert.match(chat, /error instanceof OpenAIChatResponseError/);
  assert.match(chat, /console\.error\("[^"]+", error\.code\)/);
  assert.match(search, /generate: generateResourceSelectionReply/);
  assert.match(phrase, /generate: generateResourceSelectionReply/);
  assert.match(assistant, /generateChatReply/);
  assert.doesNotMatch(assistant, /generateResourceSelectionReply/);
});
