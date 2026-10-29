import assert from "node:assert/strict";
import test from "node:test";

import {
  invalidCredentialsState,
  validateLoginCredentials,
} from "./form-state.ts";

test("login rejects missing credentials", () => {
  const formData = new FormData();

  assert.deepEqual(validateLoginCredentials(formData), {
    status: "error",
    message: "Saisissez une adresse e-mail et un mot de passe.",
  });
});

test("login rejects malformed email addresses", () => {
  const formData = new FormData();
  formData.set("email", "adresse-invalide");
  formData.set("password", "motdepasse");

  assert.deepEqual(validateLoginCredentials(formData), {
    status: "error",
    message: "Saisissez une adresse e-mail valide.",
  });
});

test("login keeps the submitted password unchanged", () => {
  const formData = new FormData();
  formData.set("email", " membre@example.com ");
  formData.set("password", "  motdepasse  ");

  assert.deepEqual(validateLoginCredentials(formData), {
    status: "success",
    credentials: {
      email: "membre@example.com",
      password: "  motdepasse  ",
    },
  });
});

test("invalid credentials use a generic message", () => {
  assert.deepEqual(invalidCredentialsState, {
    status: "error",
    message: "Adresse e-mail ou mot de passe incorrect.",
  });
});
