import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AssistantForm } from "@/features/assistant/assistant-form";
import { conversationQuestionStatusLabel } from "@/features/assistant/assistant-conversation-core";
import { hasOmittedConversationExchanges } from "@/features/assistant/conversations-core";
import { getMyConversation } from "@/features/assistant/conversations";

export const metadata: Metadata = {
  title: "Conversation - NexaMind AI",
  description: "Relire une conversation enregistrée avec l'assistant.",
};

export const instant = false;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        ) : result.messages.length === 0 ? (
          <p className="auth-message auth-message-info" role="status">
            Aucun message enregistr&eacute;.
          </p>
        ) : (
          <ol className="category-list">
            {result.messages.map((message) => (
              <li className="category-entry" key={message.id}>
                <h2>{message.role === "user" ? "Vous" : "Assistant"}</h2>
                <p>{message.content}</p>
                {message.role === "user" ? (
                  <p className="resource-meta">
                    {conversationQuestionStatusLabel(message.status)}
                  </p>
                ) : (
                  <>
                    <p className="resource-meta">
                      R&eacute;ponse historique &middot; {conversationQuestionStatusLabel(message.status)}
                    </p>
                    {message.hasUnavailableSources ? (
                      <p className="auth-message auth-message-info" role="status">
                        Cette r&eacute;ponse a &eacute;t&eacute; enregistr&eacute;e auparavant ; certaines sources ne peuvent plus &ecirc;tre v&eacute;rifi&eacute;es.
                      </p>
                    ) : null}
                    {message.sources.length ? (
                      <ul className="category-list" aria-label="Sources">
                        {message.sources.map((source, index) => (
                          <li className="category-entry" key={message.id + "-source-" + index}>
                            {source.status === "available" ? (
                              <>
                                <p>
                                  <Link className="resource-link" href={"/resources/" + source.resourceId}>
                                    {source.title}
                                  </Link>
                                </p>
                                <p className="resource-excerpt">{source.excerpt}</p>
                              </>
                            ) : (
                              <p role="status">Source non disponible</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
        {result.status === "ok" && hasOmittedConversationExchanges(result.messages) ? (
          <p className="auth-message auth-message-info" role="status">
            Seuls les 10 derniers &eacute;changes sont utilis&eacute;s pour cette r&eacute;ponse.
          </p>
        ) : null}
        {result.status === "ok" ? (
          <AssistantForm
            initialQuestionId={randomUUID()}
            conversationId={id}
            conversationMode
          />
        ) : null}
      </section>
    </main>
  );
}
