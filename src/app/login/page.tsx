import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Se connecter — NexaMind AI",
  description: "Se connecter à son compte membre NexaMind AI.",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section aria-labelledby="login-title" className="auth-card">
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

        <h1 id="login-title">Se connecter</h1>
        <p className="auth-intro">
          Retrouvez votre espace de travail NexaMind AI.
        </p>

        <LoginForm />

        <p className="auth-alternative">
          Pas encore membre ? <Link href="/signup">Créer un compte</Link>
        </p>
        <Link className="auth-back" href="/">
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}
