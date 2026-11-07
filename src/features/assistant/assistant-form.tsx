"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { submitQuestion } from "./assistant-actions";
import { editAssistantQuestion, type AssistantQuestionDraft } from "./assistant-conversation-core";
import { ASSISTANT_QUESTION_MAX_LENGTH } from "./assistant-core";
import type { AssistantFormState } from "./assistant-state";

function AssistantQuestionInput({ initial }: { initial: AssistantQuestionDraft }) {
  const [draft, setDraft] = useState(initial);

  return (
    <>
      <input name="questionId" type="hidden" value={draft.questionId} />
      <div className="auth-field">
        <label htmlFor="assistant-question">Votre question</label>
        <textarea
          id="assistant-question"
          maxLength={ASSISTANT_QUESTION_MAX_LENGTH}
          name="question"
          onChange={(event) => {
            setDraft(editAssistantQuestion(initial, event.currentTarget.value, () => crypto.randomUUID()));
          }}
          required
          rows={3}
          value={draft.question}
        />
      </div>
    </>
  );
}

export function AssistantForm({ initialQuestionId }: { initialQuestionId: string }) {
  const initialState: AssistantFormState = {
    question: "",
    questionId: initialQuestionId,
    submission: null,
  };
  const [state, formAction, pending] = useActionState(submitQuestion, initialState);
  const submission = pending ? null : state.submission;
  const outcome = submission?.status === "saved" ? submission.outcome : null;

  return (
    <>
      <form
        action={formAction}
        className="auth-form"
        // La clé remet la question saisie dans le champ après chaque réponse.
        key={`${state.questionId}:${state.question}:${state.submission?.status ?? ""}`}
      >
        <AssistantQuestionInput initial={state} />
        <p className="auth-intro">
          Votre question et des extraits de vos ressources sont envoy&eacute;s &agrave; OpenAI pour pr&eacute;parer la
          r&eacute;ponse.
        </p>
        <button className="button auth-submit" disabled={pending} type="submit">
          Poser la question
        </button>
        {submission?.status === "save-error" || submission?.status === "generation-error" ? (
          <button className="button" disabled={pending} type="submit">
            R&eacute;essayer
          </button>
        ) : null}
      </form>

      {pending ? (
        <p className="auth-message auth-message-info" role="status">
          L&apos;assistant pr&eacute;pare sa r&eacute;ponse&hellip;
        </p>
      ) : null}

      <section aria-label="R&eacute;sultat de l'assistant" className="category-list-section">
        {outcome?.status === "ok" ? (
          <>
            <h2>R&eacute;ponse</h2>
            <p className="assistant-answer">{outcome.answer}</p>
            <h2>Sources</h2>
            <ul className="category-list">
              {outcome.sources.map((source) => (
                <li key={source.resourceId}>
                  <strong>{source.title}</strong>
                  <p className="resource-excerpt">{source.excerpt}</p>
                  <Link className="resource-link" href={`/resources/${source.resourceId}`}>
                    Ouvrir la ressource
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {outcome?.status === "unknown" || outcome?.status === "no-context" ? (
          <p className="auth-message auth-message-info" role="status">
            Je ne trouve pas cette information dans les ressources disponibles.
          </p>
        ) : null}
        {submission?.status === "invalid" ? (
          <p className="auth-message auth-message-info" role="status">
            Saisissez une question de {ASSISTANT_QUESTION_MAX_LENGTH} caract&egrave;res au maximum.
          </p>
        ) : null}
        {submission?.status === "save-error" ? (
          <p className="auth-message auth-message-error" role="alert">
            L&apos;&eacute;change n&apos;a pas pu &ecirc;tre enregistr&eacute;. R&eacute;essayez.
          </p>
        ) : null}
        {submission?.status === "generation-error" ? (
          <p className="auth-message auth-message-error" role="alert">
            {submission.reason === "rate-limited"
              ? "Trop de questions en peu de temps. Réessayez dans une minute."
              : "La réponse n'a pas pu être produite. Réessayez dans un instant."}
          </p>
        ) : null}
        {submission?.status === "in-progress" ? (
          <p className="auth-message auth-message-info" role="status">
            La question est d&eacute;j&agrave; en cours de traitement. R&eacute;essayez dans un instant.
          </p>
        ) : null}
        {submission?.status === "already-complete" ? (
          <p className="auth-message auth-message-info" role="status">
            Cette question a d&eacute;j&agrave; &eacute;t&eacute; enregistr&eacute;e.
          </p>
        ) : null}
        {submission?.status === "expired" ? (
          <p className="auth-message auth-message-info" role="status">
            Cette conversation a expir&eacute;. Vous pouvez poser de nouveau cette question pour commencer
            un nouvel &eacute;change.
          </p>
        ) : null}
      </section>
    </>
  );
}
