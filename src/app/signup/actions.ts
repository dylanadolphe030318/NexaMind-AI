"use server";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { SignUpState } from "./form-state";

const genericError =
  "Inscription impossible pour le moment. Vérifiez l’adresse et le mot de passe, puis réessayez.";

export async function signUp(
  _previousState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    return {
      status: "error",
      message: "Saisissez une adresse e-mail et un mot de passe.",
    };
  }

  const email = emailValue.trim();
  const password = passwordValue;

  if (!email || !password) {
    return {
      status: "error",
      message: "L’adresse e-mail et le mot de passe sont obligatoires.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: "error",
      message: "Saisissez une adresse e-mail valide.",
    };
  }

  if (password.length < 6) {
    return {
      status: "error",
      message: "Le mot de passe doit contenir au moins 6 caractères.",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return {
        status: "error",
        message:
          error.code === "weak_password"
            ? "Le mot de passe ne respecte pas les critères configurés. Choisissez-en un autre."
            : genericError,
      };
    }

    if (!data.user) {
      return { status: "error", message: genericError };
    }

    return {
      status: "success",
      message: data.session
        ? "Votre compte membre a été créé."
        : "Si cette adresse peut être inscrite, un e-mail de confirmation a été envoyé.",
    };
  } catch (error) {
    if (isAuthRetryableFetchError(error)) {
      return {
        status: "error",
        message:
          "Le service d’inscription est temporairement indisponible. Réessayez dans quelques instants.",
      };
    }

    throw error;
  }
}
