"use client";

import { useActionState } from "react";

import { signIn } from "./actions";
import { initialLoginState, type LoginState } from "./form-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (previousState: LoginState, formData: FormData) =>
      signIn(previousState, formData),
    initialLoginState,
  );

  return (
    <form action={formAction} className="auth-form">
      <div className="auth-field">
        <label htmlFor="login-email">Adresse e-mail</label>
        <input
          autoComplete="email"
          id="login-email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">Mot de passe</label>
        <input
          autoComplete="current-password"
          id="login-password"
          name="password"
          required
          type="password"
        />
      </div>

      <button className="button auth-submit" disabled={pending} type="submit">
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      {state.status === "error" ? (
        <p className="auth-message auth-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
