"use server";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import {
  createClient,
  SupabaseConfigurationError,
} from "@/lib/supabase/server";
import {
  invalidCredentialsState,
  validateLoginCredentials,
  type LoginState,
} from "./form-state";

export async function signIn(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = validateLoginCredentials(formData);
  if (result.status === "error") {
    return result;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(
      result.credentials,
    );

    if (error || !data.user || !data.session) {
      return invalidCredentialsState;
    }

    redirect("/dashboard");
  } catch (error) {
    if (isAuthRetryableFetchError(error)) {
      return {
        status: "error",
        message:
          "Le service de connexion est temporairement indisponible. Réessayez dans quelques instants.",
      };
    }

    if (error instanceof SupabaseConfigurationError) {
      console.error("Configuration Supabase manquante pour la connexion.", error);
      return {
        status: "error",
        message:
          "Le service de connexion n’est pas configuré. Contactez l’assistance.",
      };
    }

    throw error;
  }
}
