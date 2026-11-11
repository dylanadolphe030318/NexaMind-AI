import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { conversationQuestionStatusLabel } from "@/features/assistant/assistant-conversation-core";
import { listMyConversations } from "@/features/assistant/conversations";

export const metadata: Metadata = {
  title: "Mes conversations - NexaMind AI",
  description: "Retrouver la liste de vos conversations avec l'assistant.",
};

export const instant = false;

function displayTitle(question: string): string {
  const flattened = question.replace(/\s+/g, " ").trim();
  const characters = Array.from(flattened);
  return characters.length > 80 ? `${characters.slice(0, 79).join("").trimEnd()}…` : flattened;
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string | string[]; deleteError?: string | string[] }>;
}) {
  const { deleted, deleteError } = await searchParams;
  const result = await listMyConversations();
  if (result === null) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section
        aria-labelledby="conversations-title"
        className="auth-card category-card assistant-card"
      >
        <h1 id="conversations-title">Mes conversations</h1>
        <p>
          <Link className="resource-link" href="/assistant">
            Retour &agrave; l&apos;assistant
          </Link>
        </p>
        {deleteError === "1" ? (
          <p className="auth-message auth-message-error" role="alert">
            La conversation n&apos;a pas pu &ecirc;tre supprim&eacute;e ou n&apos;est plus disponible.
          </p>
        ) : deleted === "1" ? (
          <p className="auth-message auth-message-info" role="status">
            La conversation a &eacute;t&eacute; supprim&eacute;e.
          </p>
        ) : null}
        {result.status === "error" ? (
          <p className="auth-message auth-message-error" role="alert">
            Les conversations n&apos;ont pas pu &ecirc;tre charg&eacute;es.{" "}
            <Link className="resource-link" href="/assistant/conversations">
              R&eacute;essayez.
            </Link>
          </p>
        ) : result.conversations.length === 0 ? (
          <p className="auth-message auth-message-info" role="status">
            Aucune conversation enregistr&eacute;e.
          </p>
        ) : (
          <ul className="category-list">
            {result.conversations.map((conversation) => (
              <li className="category-entry assistant-conversation-entry" key={conversation.id}>
                <h2>
                  <Link
                    className="resource-link"
                    href={`/assistant/conversations/${conversation.id}`}
                  >
                    {displayTitle(conversation.firstQuestion)}
                  </Link>
                </h2>
                <p>{conversationQuestionStatusLabel(conversation.status)}</p>
                <time dateTime={conversation.lastQuestionAt}>
                  {displayDate(conversation.lastQuestionAt)}
                </time>
                <p>
                  <Link
                    className="resource-link"
                    aria-label={`Supprimer la conversation « ${displayTitle(conversation.firstQuestion)} »`}
                    href={`/assistant/conversations/${conversation.id}?delete=confirm`}
                  >
                    Supprimer
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
