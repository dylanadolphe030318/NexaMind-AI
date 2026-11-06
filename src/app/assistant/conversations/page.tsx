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

export default async function ConversationsPage() {
  const result = await listMyConversations();
  if (result === null) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="conversations-title" className="auth-card category-card">
        <h1 id="conversations-title">Mes conversations</h1>
        <p>
          <Link href="/assistant">Retour &agrave; l&apos;assistant</Link>
        </p>
        {result.status === "error" ? (
          <p className="auth-message auth-message-error" role="alert">
            Les conversations n&apos;ont pas pu &ecirc;tre charg&eacute;es.{" "}
            <a href="/assistant/conversations">R&eacute;essayez.</a>
          </p>
        ) : result.conversations.length === 0 ? (
          <p className="auth-message auth-message-info" role="status">
            Aucune conversation enregistr&eacute;e.
          </p>
        ) : (
          <ul className="category-list">
            {result.conversations.map((conversation) => (
              <li key={conversation.id}>
                <h2>{displayTitle(conversation.firstQuestion)}</h2>
                <p>{conversationQuestionStatusLabel(conversation.status)}</p>
                <time dateTime={conversation.lastQuestionAt}>
                  {displayDate(conversation.lastQuestionAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
