"use client";

import Link from "next/link";
import { useActionState } from "react";

import { submitQuestion } from "./assistant-actions";
import { ASSISTANT_QUESTION_MAX_LENGTH } from "./assistant-core";
import { initialAssistantState } from "./assistant-state";

export function AssistantForm() {
  const [state, formAction, pending] = useActionState(submitQuestion, initialAssistantState);
  const { outcome } = state;
  const shown = pending ? null : outcome;

  return (
    <>
      <form
        action={formAction}
        className="auth-form"
        // La clé remet la question saisie dans le champ après chaque réponse.
        key={state.question + (outcome?.status ?? "")}
      >
        <div className="auth-field">
          <label htmlFor="assistant-question">Votre question</label>
          <textarea
            defaultValue={state.question}
            id="assistant-question"
            maxLength={ASSISTANT_QUESTION_MAX_LENGTH}
            name="question"
            required
            rows={3}
          />
        </div>
        <p className="auth-intro">
          Votre question et des extraits de vos ressources sont envoy&eacute;s &agrave; OpenAI pour pr&eacute;parer la
          r&eacute;ponse.
        </p>
        <button className="button auth-submit" disabled={pending} type="submit">
          Poser la question
        </button>
        {shown?.status === "error" ? (
          <button className="button" type="submit">
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
        {shown?.status === "ok" ? (
          <>
            <h2>R&eacute;ponse</h2>
            <p className="assistant-answer">{shown.answer}</p>
            <h2>Sources</h2>
            <ul className="category-list">
              {shown.sources.map((source) => (
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
        {shown?.status === "unknown" || shown?.status === "no-context" ? (
          <p className="auth-message auth-message-info" role="status">
            Je ne trouve pas cette information dans les ressources disponibles.
          </p>
        ) : null}
        {shown?.status === "invalid" ? (
          <p className="auth-message auth-message-info" role="status">
            Saisissez une question de {ASSISTANT_QUESTION_MAX_LENGTH} caract&egrave;res au maximum.
          </p>
        ) : null}
        {shown?.status === "rate-limited" ? (
          <p className="auth-message auth-message-error" role="alert">
            Trop de questions en peu de temps. R&eacute;essayez dans une minute.
          </p>
        ) : null}
        {shown?.status === "error" ? (
          <p className="auth-message auth-message-error" role="alert">
            La r&eacute;ponse n&apos;a pas pu &ecirc;tre produite. R&eacute;essayez dans un instant.
          </p>
        ) : null}
      </section>
    </>
  );
}
