import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const memberAEmail = process.env.RLS_TEST_MEMBER_A_EMAIL;
const memberAPassword = process.env.RLS_TEST_MEMBER_A_PASSWORD;
const memberBEmail = process.env.RLS_TEST_MEMBER_B_EMAIL;
const memberBPassword = process.env.RLS_TEST_MEMBER_B_PASSWORD;
const managerEmail = process.env.RLS_TEST_MANAGER_EMAIL;
const managerPassword = process.env.RLS_TEST_MANAGER_PASSWORD;
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
    let manager = null;

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
        for (const table of ["profiles", "workspaces", "categories"]) {
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

      await t.test("un membre lit son profil, son espace et les categories disponibles", async () => {
        const { data: ownProfile, error: ownProfileError } = await memberA
          .from("profiles")
          .select("id, workspace_id, role")
          .eq("id", sessionA.user.id)
          .maybeSingle();

        assert.ifError(ownProfileError);
        assert.ok(ownProfile, "le profil du membre doit exister");
        assert.equal(ownProfile?.id, sessionA.user.id);
        assert.equal(ownProfile?.role, "membre");

        const { data: ownWorkspace, error: workspaceError } = await memberA
          .from("workspaces")
          .select("id")
          .eq("id", ownProfile.workspace_id)
          .maybeSingle();

        assert.ifError(workspaceError);
        assert.equal(ownWorkspace?.id, ownProfile.workspace_id);

        const { error: categoriesError } = await memberA
          .from("categories")
          .select("id, name")
          .eq("workspace_id", ownProfile.workspace_id);

        assert.ifError(categoriesError);
      });

      await t.test("le responsable cree et renomme une categorie visible par les membres", async (managerTest) => {
        if (!managerEmail || !managerPassword) {
          managerTest.skip("RLS_TEST_MANAGER_EMAIL et RLS_TEST_MANAGER_PASSWORD absents : test AC4 responsable ignore.");
          return;
        }

        manager = createClient(supabaseUrl, publishableKey, clientOptions);
        const { data: managerSession, error: managerLoginError } =
          await manager.auth.signInWithPassword({
            email: managerEmail,
            password: managerPassword,
          });
        assert.ifError(managerLoginError);
        assert.ok(managerSession.user, "le responsable doit avoir une session");
        const { data: managerProfile, error: managerProfileError } = await manager
          .from("profiles")
          .select("id, workspace_id, role")
          .eq("id", managerSession.user.id)
          .maybeSingle();

        assert.ifError(managerProfileError);
        assert.ok(managerProfile, "le profil du responsable doit exister");
        assert.equal(managerProfile?.role, "responsable");

        const { error: whitespaceNameError } = await manager.from("categories").insert({
          name: "\t\n ",
          workspace_id: managerProfile.workspace_id,
        });
        assert.equal(whitespaceNameError?.code, "23514");

        const { data: memberProfile, error: memberProfileError } = await memberA
          .from("profiles")
          .select("workspace_id")
          .eq("id", sessionA.user.id)
          .maybeSingle();

        assert.ifError(memberProfileError);
        assert.equal(memberProfile?.workspace_id, managerProfile.workspace_id);

        const categoryName = "RLS-" + randomUUID();
        const renamedCategoryName = categoryName + "-renommee";
        const { data: createdCategory, error: createError } = await manager
          .from("categories")
          .insert({
            name: categoryName,
            workspace_id: managerProfile.workspace_id,
          })
          .select("id, name")
          .single();

        assert.ifError(createError);
        assert.ok(createdCategory, "le responsable doit creer la categorie");
        assert.equal(createdCategory?.name, categoryName);

        const { data: visibleCategory, error: memberReadError } = await memberA
          .from("categories")
          .select("id, name")
          .eq("id", createdCategory.id)
          .maybeSingle();

        assert.ifError(memberReadError);
        assert.equal(visibleCategory?.name, categoryName);

        const { error: memberCreateError } = await memberA
          .from("categories")
          .insert({
            name: "RLS-member-" + randomUUID(),
            workspace_id: managerProfile.workspace_id,
          });
        assert.equal(memberCreateError?.code, "42501");

        const { data: memberRenameResult, error: memberRenameError } = await memberA
          .from("categories")
          .update({ name: "interdit-" + randomUUID() })
          .eq("id", createdCategory.id)
          .select("id");

        assert.ifError(memberRenameError);
        assert.equal(memberRenameResult?.length ?? 0, 0);

        const { data: managerRenameResult, error: managerRenameError } = await manager
          .from("categories")
          .update({ name: renamedCategoryName })
          .eq("id", createdCategory.id)
          .select("id")
          .maybeSingle();

        assert.ifError(managerRenameError);
        assert.ok(managerRenameResult, "le responsable doit renommer la categorie");

        const { data: renamedCategory, error: renamedReadError } = await memberA
          .from("categories")
          .select("name")
          .eq("id", createdCategory.id)
          .maybeSingle();

        assert.ifError(renamedReadError);
        assert.equal(renamedCategory?.name, renamedCategoryName);
      });

      await t.test("un membre ne lit pas le profil d'un autre membre", async () => {
        const { data: memberBProfile, error: memberBProfileError } =
          await memberB
            .from("profiles")
            .select("id, role")
            .eq("id", sessionB.user.id)
            .maybeSingle();

        assert.ifError(memberBProfileError);
        assert.equal(memberBProfile?.id, sessionB.user.id);
        assert.equal(memberBProfile?.role, "membre");

        const { data: otherProfile, error } = await memberA
          .from("profiles")
          .select("id")
          .eq("id", sessionB.user.id)
          .maybeSingle();

        assert.ifError(error);
        assert.equal(otherProfile, null);

        const { data: memberAProfile, error: memberAProfileError } =
          await memberA
            .from("profiles")
            .select("id")
            .eq("id", sessionA.user.id)
            .maybeSingle();

        assert.ifError(memberAProfileError);
        assert.equal(memberAProfile?.id, sessionA.user.id);

        const { data: otherProfileFromB, error: otherProfileFromBError } =
          await memberB
            .from("profiles")
            .select("id")
            .eq("id", sessionA.user.id)
            .maybeSingle();

        assert.ifError(otherProfileFromBError);
        assert.equal(otherProfileFromB, null);
      });
    } finally {
      await Promise.all([
        anonymousClient.auth.signOut(),
        memberA.auth.signOut(),
        memberB.auth.signOut(),
      ]);
      if (manager) {
        await manager.auth.signOut();
      }
    }
  },
);
