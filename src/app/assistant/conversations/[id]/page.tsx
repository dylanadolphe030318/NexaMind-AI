import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AssistantForm } from "@/features/assistant/assistant-form";
import { AssistantAnswer } from "@/features/assistant/assistant-answer";
import { conversationQuestionStatusLabel } from "@/features/assistant/assistant-conversation-core";
import { getMyConversation } from "@/features/assistant/conversations";
import { deleteConversationAction } from "@/features/assistant/assistant-actions";

export const metadata: Metadata = {
  title: "Conversation - NexaMind AI",
  description: "Relire une conversation enregistrée avec l'assistant.",
};

export const instant = false;

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ delete?: string | string[]; error?: string | string[] }>;
}) {
  const { id } = await params;
  const { delete: deleteMode, error } = await searchParams;
  const result = await getMyConversation(id);
  if (result === null) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="conversation-title" className="auth-card category-card">
        <h1 id="conversation-title">Conversation</h1>
        <p>
          <Link href="/assistant/conversations">Retour &agrave; mes conversations</Link>
        </p>
        {result.status === "unavailable" ? (
          <p className="auth-message auth-message-info" role="status">
            Cette conversation n&apos;est pas disponible.
          </p>
        ) : result.status === "error" ? (
          <p className="auth-message auth-message-error" role="alert">
            La conversation n&apos;a pas pu &ecirc;tre charg&eacute;e.{" "}
            <Link href={"/assistant/conversations/" + id}>R&eacute;essayez.</Link>
          </p>
        ) : deleteMode === "confirm" ? (
          <>
            <h2>Supprimer la conversation</h2>
            <p>
              Supprimer la conversation &laquo;&nbsp;
              {result.messages.find((message) => message.role === "user")?.content ?? "Conversation sans titre"}
              &nbsp;&raquo; ?
            </p>
            <p>Cette action est d&eacute;finitive.</p>
            {error === "1" ? (
              <p className="auth-message auth-message-error" role="alert">
                La conversation n&apos;a pas pu &ecirc;tre supprim&eacute;e. R&eacute;essayez.
              </p>
            ) : null}
            <form action={deleteConversationAction} className="resource-delete-actions">
              <input name="conversationId" type="hidden" value={id} />
              <button className="button auth-submit" type="submit">
                Supprimer
              </button>
              <Link className="button button-secondary" href={`/assistant/conversations/${id}`}>
                Annuler
              </Link>
            </form>
          </>
        ) : result.messages.length === 0 ? (
          <p className="auth-message auth-message-info" role="status">
            Aucun message enregistr&eacute;.
          </p>
        ) : (
          <ol className="category-list">
            {result.messages.map((message) => (
              <li className="category-entry" key={message.id}>
                <h2>{message.role === "user" ? "Vous" : "Assistant"}</h2>
                {message.role === "user" ? (
                  <>
                    <p>{message.content}</p>
                    <p className="resource-meta">
                      {conversationQuestionStatusLabel(message.status)}
                    </p>
                  </>
                ) : (
                  <div className="conversation-assistant-content">
                    <p className="resource-meta">
                      R&eacute;ponse historique &middot; {conversationQuestionStatusLabel(message.status)}
                    </p>
                    {message.hasUnavailableSources ? (
                      <p className="auth-message auth-message-info" role="status">
                        Cette r&eacute;ponse a &eacute;t&eacute; enregistr&eacute;e auparavant ; certaines sources ne peuvent plus &ecirc;tre v&eacute;rifi&eacute;es.
                      </p>
                    ) : null}
                    <AssistantAnswer answer={message.content} sources={message.sources} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        {result.status === "ok" && result.messages.filter((message) => message.role === "user").length > 10 ? (
          <p className="auth-message auth-message-info" role="status">
            Seuls les 10 derniers &eacute;changes sont utilis&eacute;s pour cette r&eacute;ponse.
          </p>
        ) : null}
        {result.status === "ok" ? (
          <>
            {deleteMode === "confirm" ? null : (
              <>
                <p>
                  <Link
                    className="button button-secondary"
                    href={`/assistant/conversations/${id}?delete=confirm`}
                  >
                    Supprimer la conversation
                  </Link>
                </p>
                <AssistantForm
                  initialQuestionId={randomUUID()}
                  conversationId={id}
                  conversationMode
                />
              </>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
