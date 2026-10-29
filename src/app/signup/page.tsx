import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Créer un compte — NexaMind AI",
  description: "Créer un compte membre NexaMind AI.",
};

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section aria-labelledby="signup-title" className="auth-card">
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

        <h1 id="signup-title">Créer un compte membre</h1>
        <p className="auth-intro">
          Rejoignez l’espace de travail NexaMind AI avec votre adresse e-mail.
        </p>

        <SignUpForm />

        <p className="auth-alternative">
          Déjà membre ? <Link href="/login">Se connecter</Link>
        </p>
        <Link className="auth-back" href="/">
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}
