import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const memberAEmail = process.env.RLS_TEST_MEMBER_A_EMAIL;
const memberAPassword = process.env.RLS_TEST_MEMBER_A_PASSWORD;
const memberBEmail = process.env.RLS_TEST_MEMBER_B_EMAIL;
const memberBPassword = process.env.RLS_TEST_MEMBER_B_PASSWORD;
const requiredVariables = [
  ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publishableKey],
  ["RLS_TEST_MEMBER_A_EMAIL", memberAEmail],
  ["RLS_TEST_MEMBER_A_PASSWORD", memberAPassword],
  ["RLS_TEST_MEMBER_B_EMAIL", memberBEmail],
  ["RLS_TEST_MEMBER_B_PASSWORD", memberBPassword],
];
const missingVariables = requiredVariables
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingVariables.length) {
  throw new Error(
    `Variables manquantes pour les tests RLS : ${missingVariables.join(", ")}`,
  );
}

function isPrivilegedKey(key) {
  if (key.startsWith("sb_secret_")) {
    return true;
  }

  const payload = key.split(".")[1];
  if (!payload) {
    return false;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role
      === "service_role";
  } catch {
    return false;
  }
}

if (isPrivilegedKey(publishableKey)) {
  throw new Error(
    "Les tests RLS refusent toute clé Supabase privilégiée.",
  );
}

test(
  "les politiques RLS limitent les lectures aux sessions autorisées",
  async (t) => {
    const clientOptions = {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    };
    const anonymousClient = createClient(
      supabaseUrl,
      publishableKey,
      clientOptions,
    );
    const memberA = createClient(supabaseUrl, publishableKey, clientOptions);
    const memberB = createClient(supabaseUrl, publishableKey, clientOptions);

    try {
      const { data: sessionA, error: loginErrorA } =
        await memberA.auth.signInWithPassword({
          email: memberAEmail,
          password: memberAPassword,
        });
      assert.ifError(loginErrorA);
      assert.ok(sessionA.user, "le membre A doit avoir une session réelle");

      const { data: sessionB, error: loginErrorB } =
        await memberB.auth.signInWithPassword({
          email: memberBEmail,
          password: memberBPassword,
        });
      assert.ifError(loginErrorB);
      assert.ok(sessionB.user, "le membre B doit avoir une session réelle");
      assert.notEqual(
        sessionA.user.id,
        sessionB.user.id,
        "les deux comptes de test doivent être distincts",
      );

      await t.test("un visiteur anonyme ne lit pas les tables protégées", async () => {
        for (const table of ["profiles", "workspaces"]) {
          const { data, error } = await anonymousClient
            .from(table)
            .select("*")
            .limit(1);

          if (error) {
            assert.equal(
              error.code,
              "42501",
              `la lecture anonyme de ${table} doit échouer faute de privilège`,
            );
          } else {
            assert.equal(
              data?.length ?? 0,
              0,
              `aucune ligne de ${table} ne doit être exposée`,
            );
          }
        }
      });

      await t.test("un membre lit son profil et son espace", async () => {
        const { data: ownProfile, error: ownProfileError } = await memberA
          .from("profiles")
          .select("id, workspace_id")
          .eq("id", sessionA.user.id)
          .maybeSingle();

        assert.ifError(ownProfileError);
        assert.ok(ownProfile, "le profil du membre doit exister");
        assert.equal(ownProfile?.id, sessionA.user.id);

        const { data: ownWorkspace, error: workspaceError } = await memberA
          .from("workspaces")
          .select("id")
          .eq("id", ownProfile.workspace_id)
          .maybeSingle();

        assert.ifError(workspaceError);
        assert.equal(ownWorkspace?.id, ownProfile.workspace_id);
      });

      await t.test("un membre ne lit pas le profil d'un autre membre", async () => {
        const { data: memberBProfile, error: memberBProfileError } =
          await memberB
            .from("profiles")
            .select("id")
            .eq("id", sessionB.user.id)
            .maybeSingle();

        assert.ifError(memberBProfileError);
        assert.equal(memberBProfile?.id, sessionB.user.id);

        const { data: otherProfile, error } = await memberA
          .from("profiles")
          .select("id")
          .eq("id", sessionB.user.id)
          .maybeSingle();

        assert.ifError(error);
        assert.equal(otherProfile, null);
      });
    } finally {
      await Promise.all([
        anonymousClient.auth.signOut(),
        memberA.auth.signOut(),
        memberB.auth.signOut(),
      ]);
    }
  },
);
