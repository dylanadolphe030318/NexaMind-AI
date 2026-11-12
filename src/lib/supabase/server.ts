import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new SupabaseConfigurationError(
      "La variable NEXT_PUBLIC_SUPABASE_URL est manquante.",
    );
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new SupabaseConfigurationError(
      "La variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY est manquante.",
    );
  }

  // L'authentification Supabase peut lire l'heure avant son premier acces aux cookies.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Dans un composant serveur, le cookie est déjà rafraîchi par src/proxy.ts.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}
