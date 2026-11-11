import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AssistantForm } from "@/features/assistant/assistant-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Assistant - NexaMind AI",
  description: "Poser une question aux ressources disponibles.",
};

export const instant = false;

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="assistant-title" className="auth-card category-card assistant-card">
        <h1 id="assistant-title">Assistant</h1>
        <p>
          <Link className="resource-link" href="/assistant/conversations">
            Mes conversations
          </Link>
        </p>
        <AssistantForm initialQuestionId={randomUUID()} />
      </section>
    </main>
  );
}
