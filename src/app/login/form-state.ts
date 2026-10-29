export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginCredentialsResult =
  | { status: "success"; credentials: LoginCredentials }
  | Extract<LoginState, { status: "error" }>;

export const initialLoginState: LoginState = { status: "idle" };

export const invalidCredentialsState = {
  status: "error",
  message: "Adresse e-mail ou mot de passe incorrect.",
} as const;

export function validateLoginCredentials(
  formData: FormData,
): LoginCredentialsResult {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    return {
      status: "error",
      message: "Saisissez une adresse e-mail et un mot de passe.",
    };
  }

  const email = emailValue.trim();

  if (!email || !passwordValue) {
    return {
      status: "error",
      message: "Saisissez une adresse e-mail et un mot de passe.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: "error",
      message: "Saisissez une adresse e-mail valide.",
    };
  }

  return {
    status: "success",
    credentials: { email, password: passwordValue },
  };
}
