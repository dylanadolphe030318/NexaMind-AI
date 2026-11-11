import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const css = readFileSync("src/app/globals.css", "utf8");

function loadTypeScript(path, resolveImport = require) {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
    },
  });
  const loadedModule = { exports: {} };
  new Function("require", "exports", "module", outputText)(
    resolveImport,
    loadedModule.exports,
    loadedModule,
  );
  return loadedModule.exports;
}

function mockLink({ href, children, ...props }) {
  return createElement("a", { href, ...props }, children);
}

function contrastRatio(foreground, background) {
  const luminance = (hex) => {
    const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function colorToken(name) {
  const value = css.match(new RegExp(`--${name}:\\s*(#[a-f\\d]{6})`, "i"))?.[1];
  assert.ok(value, `Le token --${name} doit contenir une couleur hexadécimale.`);
  return value.toLowerCase();
}

test("les quatre pages rendent la marque, les parcours et les informations attendus", async () => {
  const { default: Home } = loadTypeScript("src/app/page.tsx", (specifier) =>
    specifier === "next/link" ? mockLink : require(specifier),
  );
  const homeMarkup = renderToStaticMarkup(createElement(Home));
  assert.match(homeMarkup, /NexaMind <span class="brand-ai">AI<\/span>/);
  assert.match(homeMarkup, /href="\/login"/);
  assert.match(homeMarkup, /href="\/signup"/);

  const loginResolver = (specifier) => {
    if (specifier === "next/link") return mockLink;
    if (specifier === "./login-form") {
      return {
        LoginForm: () =>
          createElement("form", { className: "auth-form" }, "Formulaire connexion"),
      };
    }
    return require(specifier);
  };
  const { default: LoginPage } = loadTypeScript(
    "src/app/login/page.tsx",
    loginResolver,
  );
  const loginMarkup = renderToStaticMarkup(
    await LoginPage({ searchParams: Promise.resolve({ signOutError: "1" }) }),
  );
  assert.match(loginMarkup, /Se connecter/);
  assert.match(loginMarkup, /aria-live="polite"/);
  assert.match(loginMarkup, /class="auth-message auth-message-error"/);
  assert.match(loginMarkup, /href="\/signup"/);
  assert.match(loginMarkup, /class="brand-mark"/);

  const signupResolver = (specifier) => {
    if (specifier === "next/link") return mockLink;
    if (specifier === "./signup-form") {
      return {
        SignUpForm: () =>
          createElement("form", { className: "auth-form" }, "Formulaire inscription"),
      };
    }
    return require(specifier);
  };
  const { default: SignUpPage } = loadTypeScript(
    "src/app/signup/page.tsx",
    signupResolver,
  );
  const signupMarkup = renderToStaticMarkup(createElement(SignUpPage));
  assert.match(signupMarkup, /Créer un compte membre/);
  assert.match(signupMarkup, /href="\/login"/);
  assert.match(signupMarkup, /class="brand-mark"/);

  const dashboardResolver = (specifier) => {
    if (specifier === "next/link") return mockLink;
    if (specifier === "next/navigation") {
      return { redirect: (destination) => { throw new Error(`redirect:${destination}`); } };
    }
    if (specifier === "@/lib/supabase/server") {
      return {
        createClient: async () => ({
          auth: {
            getUser: async () => ({
              data: { user: { id: "member-1", email: "membre@example.test" } },
            }),
          },
          from: () => ({
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { role: "membre" } }) }),
            }),
          }),
        }),
      };
    }
    if (specifier === "./actions") return { signOut: async () => {} };
    return require(specifier);
  };
  const { default: DashboardPage } = loadTypeScript(
    "src/app/dashboard/page.tsx",
    dashboardResolver,
  );
  const dashboardMarkup = renderToStaticMarkup(await DashboardPage());
  assert.match(dashboardMarkup, /class="auth-card dashboard-card"/);
  assert.match(dashboardMarkup, /membre@example\.test/);
  assert.match(dashboardMarkup, /Votre rôle\s*:\s*<strong>Membre<\/strong>/);
  for (const destination of [
    "/categories",
    "/resources",
    "/resources/searches",
    "/assistant",
  ]) {
    assert.match(dashboardMarkup, new RegExp(`href="${destination.replaceAll("/", "\\/")}"`));
  }
  assert.match(dashboardMarkup, /Se déconnecter/);
});

test("les parcours de formulaire conservent leurs états annoncés et leur attente visible", () => {
  const loginForm = readFileSync("src/app/login/login-form.tsx", "utf8");
  const signupForm = readFileSync("src/app/signup/signup-form.tsx", "utf8");

  assert.match(loginForm, /id="login-email"[\s\S]*?name="email"[\s\S]*?type="email"/);
  assert.match(loginForm, /id="login-password"[\s\S]*?name="password"[\s\S]*?type="password"/);
  assert.match(loginForm, /pending \? "Connexion…"/);
  assert.match(loginForm, /disabled=\{pending\}/);
  assert.match(loginForm, /className="auth-message auth-message-error" role="alert"/);
  assert.match(signupForm, /pending \? "Création du compte…"/);
  assert.match(signupForm, /id="signup-email"[\s\S]*?name="email"[\s\S]*?type="email"/);
  assert.match(signupForm, /id="signup-password"[\s\S]*?name="password"[\s\S]*?type="password"/);
  assert.match(signupForm, /disabled=\{pending\}/);
  assert.match(signupForm, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(css, /\.auth-submit:disabled\s*\{[^}]*opacity:\s*0\.7/s);
  assert.match(css, /\.auth-message-error\s*\{[^}]*background:\s*#fff6f8/s);
  assert.match(css, /\.auth-message-success\s*\{[^}]*background:\s*#f3fbf6/s);
});

test("les vrais formulaires rendent les champs, erreurs et annonces d'état", () => {
  const react = require("react");
  const loginResolver = (specifier) => {
    if (specifier === "react") {
      return {
        ...react,
        useActionState: () => [
          { status: "error", message: "Vérifiez votre adresse ou votre mot de passe." },
          () => {},
          true,
        ],
      };
    }
    if (specifier === "./actions") return { signIn: async () => ({}) };
    if (specifier === "./form-state") {
      return { initialLoginState: { status: "idle", message: "" } };
    }
    return require(specifier);
  };
  const { LoginForm } = loadTypeScript(
    "src/app/login/login-form.tsx",
    loginResolver,
  );
  const loginMarkup = renderToStaticMarkup(createElement(LoginForm));
  assert.match(loginMarkup, /id="login-email"/);
  assert.match(loginMarkup, /<label for="login-email">Adresse e-mail<\/label>/);
  assert.match(loginMarkup, /id="login-password"/);
  assert.match(loginMarkup, /<label for="login-password">Mot de passe<\/label>/);
  assert.match(loginMarkup, /disabled=""[^>]*>Connexion…/);
  assert.match(loginMarkup, /role="alert"/);

  const signupResolver = (specifier) => {
    if (specifier === "react") {
      return {
        ...react,
        useActionState: () => [
          { status: "success", message: "Consultez votre messagerie." },
          () => {},
          true,
        ],
      };
    }
    if (specifier === "./actions") return { signUp: async () => ({}) };
    if (specifier === "./form-state") {
      return { initialSignUpState: { status: "idle", message: "" } };
    }
    return require(specifier);
  };
  const { SignUpForm } = loadTypeScript(
    "src/app/signup/signup-form.tsx",
    signupResolver,
  );
  const signupMarkup = renderToStaticMarkup(createElement(SignUpForm));
  assert.match(signupMarkup, /id="signup-email"/);
  assert.match(signupMarkup, /<label for="signup-email">Adresse e-mail<\/label>/);
  assert.match(signupMarkup, /id="signup-password"/);
  assert.match(signupMarkup, /<label for="signup-password">Mot de passe<\/label>/);
  assert.match(signupMarkup, /disabled=""[^>]*>Création du compte…/);
  assert.match(signupMarkup, /role="status"/);
  assert.match(signupMarkup, /Consultez votre messagerie\./);
});

test("les tokens et contrôles respectent les contrastes AA de DESIGN", () => {
  const primary = colorToken("purple");
  const primaryHover = colorToken("purple-deep");
  const text = colorToken("ink");
  const secondary = colorToken("muted");
  const surface = colorToken("surface-mauve");
  const error = colorToken("error");
  const success = colorToken("success");
  const controlBorder = colorToken("control-border");
  const focus = colorToken("focus");
  const accent = colorToken("pink");
  const gradientEnd = css.match(
    /\.button\s*\{[^}]*background:\s*linear-gradient\(135deg,\s*var\(--purple\),\s*(#[a-f\d]{6})\)/i,
  )?.[1];

  assert.deepEqual(
    {
      primary,
      primaryHover,
      text,
      secondary,
      surface,
      error,
      success,
      accent,
      focus,
    },
    {
      primary: "#5b21b6",
      primaryHover: "#3b0764",
      text: "#252032",
      secondary: "#6e6878",
      surface: "#f3edf8",
      error: "#b42318",
      success: "#24734b",
      accent: "#b83e6e",
      focus: "#252032",
    },
  );
  assert.ok(gradientEnd, "Le bouton principal doit exposer son extrémité de dégradé.");
  assert.equal(gradientEnd.toLowerCase(), "#6d28d9");
  assert.ok(contrastRatio("#ffffff", primary) >= 4.5);
  assert.ok(contrastRatio("#ffffff", gradientEnd) >= 4.5);
  assert.ok(contrastRatio("#ffffff", primaryHover) >= 4.5);
  assert.ok(contrastRatio(secondary, "#ffffff") >= 4.5);
  assert.ok(contrastRatio(secondary, surface) >= 4.5);
  assert.ok(contrastRatio(text, surface) >= 4.5);
  assert.ok(contrastRatio(accent, "#ffffff") >= 4.5);
  assert.ok(contrastRatio(error, "#fff6f8") >= 4.5);
  assert.ok(contrastRatio(success, "#f3fbf6") >= 4.5);
  assert.ok(contrastRatio(controlBorder, "#ffffff") >= 3);
  assert.ok(contrastRatio(focus, "#ffffff") >= 3);
  assert.match(css, /\.auth-card\s*\{[^}]*background:\s*var\(--surface-mauve\)/s);
  assert.match(css, /--surface-mauve:\s*#f3edf8/);
  assert.match(css, /--radius-field:\s*12px/);
  assert.match(css, /--radius-button:\s*14px/);
  assert.match(css, /--radius-card:\s*20px/);
  assert.match(css, /--font-system:\s*system-ui,\s*sans-serif/);
  assert.match(css, /\.dashboard-card \.dashboard-categories-link\s*\{[^}]*border-color:\s*var\(--control-border\)/s);
  assert.match(css, /\.button:hover\s*\{[^}]*background:\s*var\(--purple-deep\)/s);

  const gradientSelectors = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , declarations]) => declarations.includes("gradient("))
    .map(([, selector]) => selector.trim());
  assert.deepEqual(gradientSelectors, [".brand-mark", ".button"]);
});

test("la mise en page reste utilisable au mobile, au clavier et avec mouvement réduit", () => {
  const narrowHeader = css.match(
    /@media \(max-width: 480px\)\s*\{([\s\S]*?)\n\}/,
  )?.[1];
  const narrowShell = css.match(
    /@media \(max-width: 420px\)\s*\{([\s\S]*?)\n\}/,
  )?.[1];
  const narrowAuthCard = css.match(
    /@media \(max-width: 480px\)\s*\{\s*\.auth-card\s*\{([^}]*)\}/,
  )?.[1];
  assert.ok(narrowHeader);
  assert.match(narrowHeader, /\.site-header\s*\{[^}]*align-items:\s*flex-start/s);
  assert.match(narrowHeader, /\.header-actions\s*\{[^}]*width:\s*100%/s);
  assert.ok(narrowShell);
  assert.match(narrowShell, /\.page-shell\s*\{[^}]*width:\s*calc\(100% - 32px\)/s);
  assert.ok(narrowAuthCard);
  assert.match(narrowAuthCard, /padding:\s*30px 24px/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /a:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\)/s);
  assert.match(css, /\.auth-field input:focus-visible,[\s\S]*?outline:\s*3px solid var\(--focus\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("un visiteur conserve la redirection du tableau de bord vers la connexion", async () => {
  const resolver = (specifier) => {
    if (specifier === "next/link") return { default: mockLink };
    if (specifier === "next/navigation") {
      return {
        redirect: (destination) => { throw new Error(`redirect:${destination}`); },
      };
    }
    if (specifier === "@/lib/supabase/server") {
      return {
        createClient: async () => ({
          auth: { getUser: async () => ({ data: { user: null } }) },
        }),
      };
    }
    if (specifier === "./actions") return { signOut: async () => {} };
    return require(specifier);
  };
  const { default: DashboardPage } = loadTypeScript(
    "src/app/dashboard/page.tsx",
    resolver,
  );

  await assert.rejects(DashboardPage(), /redirect:\/login/);
});
