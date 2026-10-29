"use client";

import { useActionState, useState } from "react";

import { signUp } from "./actions";
import { initialSignUpState, type SignUpState } from "./form-state";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(
    async (previousState: SignUpState, formData: FormData) => {
      const nextState = await signUp(previousState, formData);
      if (nextState.status === "success") {
        setPassword("");
      }
      return nextState;
    },
    initialSignUpState,
  );

  return (
    <form action={formAction} className="auth-form">
      <div className="auth-field">
        <label htmlFor="signup-email">Adresse e-mail</label>
        <input
          autoComplete="email"
          id="signup-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signup-password">Mot de passe</label>
        <input
          autoComplete="new-password"
          id="signup-password"
          minLength={6}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <p className="auth-hint">6 caractères minimum.</p>
      </div>

      <button className="button auth-submit" disabled={pending} type="submit">
        {pending ? "Création du compte…" : "Créer mon compte"}
      </button>

      {state.message ? (
        <p
          className={`auth-message auth-message-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
