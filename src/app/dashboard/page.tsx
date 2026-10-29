import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Espace membre — NexaMind AI",
  description: "Votre espace membre NexaMind AI.",
};

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ signOutError?: string }>;
}) {
  const { signOutError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="auth-page">
      <section aria-labelledby="dashboard-title" className="auth-card">
        <Link aria-label="NexaMind AI, accueil" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            <svg fill="none" viewBox="0 0 32 32">
              <path
                d="M7 23V9l9 10V9l9 14V9"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            </svg>
          </span>
          <span>
            NexaMind <span className="brand-ai">AI</span>
          </span>
        </Link>

        <h1 id="dashboard-title">Espace membre</h1>
        <p className="auth-intro">
          Vous êtes connecté à votre espace NexaMind AI.
        </p>
        <p className="member-identity">
          Connecté en tant que <strong>{user.email ?? "Membre"}</strong>
        </p>

        {signOutError === "1" ? (
          <p aria-live="polite" className="form-message form-message-error">
            La déconnexion a échoué. Veuillez réessayer.
          </p>
        ) : null}

        <form action={signOut} className="auth-form">
          <button className="button auth-submit" type="submit">
            Se déconnecter
          </button>
        </form>
      </section>
    </main>
  );
}
