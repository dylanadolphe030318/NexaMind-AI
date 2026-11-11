import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { runWithRlsCleanup } from "./helpers/rls-cleanup.mjs";

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
  ["RLS_TEST_MANAGER_EMAIL", managerEmail],
  ["RLS_TEST_MANAGER_PASSWORD", managerPassword],
];
const missingVariables = requiredVariables
  .filter(([, value]) => !value)
  .map(([name]) => name);

async function runCleanupSteps(operations, label) {
  const errors = [];
  for (const operation of operations) {
    try {
      await operation();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    throw new AggregateError(errors, `Échec du nettoyage ${label}.`);
  }
}

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
    const manager = createClient(supabaseUrl, publishableKey, clientOptions);
    const resourceCleanup = [];
    const searchCleanup = [];
    const categoryCleanup = [];
    let managerProfile;

    function trackResource(id, client = memberA) {
      resourceCleanup.push(async () => {
        const { error: deleteError } = await client
          .from("resources")
          .delete()
          .eq("id", id);
        assert.ifError(deleteError);
        const { data: remaining, error: verifyError } = await client
          .from("resources")
          .select("id")
          .eq("id", id)
          .maybeSingle();
        assert.ifError(verifyError);
        assert.equal(remaining, null, `la ressource exacte ${id} doit être absente`);
      });
    }

    function trackSearch(id, client = memberA) {
      searchCleanup.push(async () => {
        const { error: deleteError } = await client
          .from("searches")
          .delete()
          .eq("id", id);
        assert.ifError(deleteError);
        const { data: remaining, error: verifyError } = await client
          .from("searches")
          .select("id")
          .eq("id", id)
          .maybeSingle();
        assert.ifError(verifyError);
        assert.equal(remaining, null, `la recherche exacte ${id} doit être absente`);
      });
    }

    function trackCategory(id, workspaceId) {
      const fixture = { id, workspaceId, deleted: false, verified: false };
      categoryCleanup.push(async () => {
        if (fixture.verified) return;
        const { data: deleted, error: deleteError } = await manager.rpc(
          "cleanup_rls_test_category",
          { p_workspace_id: workspaceId, p_category_id: id },
        );
        assert.ifError(deleteError);
        assert.equal(
          deleted,
          !fixture.deleted,
          "le nettoyage confirme l'état attendu de la catégorie exacte",
        );
        fixture.deleted = true;
        const { data: retried, error: retryError } = await manager.rpc(
          "cleanup_rls_test_category",
          { p_workspace_id: workspaceId, p_category_id: id },
        );
        assert.ifError(retryError);
        assert.equal(retried, false, "le réessai confirme l’absence");
        const { data: remaining, error: verifyError } = await manager
          .from("categories")
          .select("id")
          .eq("id", id)
          .maybeSingle();
        assert.ifError(verifyError);
        assert.equal(remaining, null, "la catégorie supprimée est absente");
        fixture.verified = true;
      });
      return fixture;
    }

    await runWithRlsCleanup({
      action: async () => {
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
      const { data: managerSession, error: managerLoginError } =
        await manager.auth.signInWithPassword({
          email: managerEmail,
          password: managerPassword,
        });
      assert.ifError(managerLoginError);
      assert.ok(managerSession.user, "le responsable doit avoir une session réelle");
      const { data: managerProfileData, error: managerProfileError } = await manager
        .from("profiles")
        .select("id, workspace_id, role")
        .eq("id", managerSession.user.id)
        .maybeSingle();
      assert.ifError(managerProfileError);
      assert.ok(managerProfileData, "le profil du responsable doit exister");
      assert.equal(managerProfileData.role, "responsable");
      managerProfile = managerProfileData;

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

      await t.test("le responsable cree et renomme une categorie visible par les membres", async () => {
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
        const renamedCategoryName = categoryName + "-renomm\u00e9e";
        const { data: createdCategory, error: createError } = await manager
          .from("categories")
          .insert({
            name: categoryName,
            workspace_id: managerProfile.workspace_id,
          })
          .select("id, name")
          .single();
        assert.ifError(createError);
          if (createdCategory?.id) {
            trackCategory(createdCategory.id, managerProfile.workspace_id);
          }
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

      await t.test("le RPC de nettoyage est borné, refuse les catégories interdites et permet le réessai", async () => {
        const categoryName = "RLS-" + randomUUID();
        const { data: category, error: createError } = await manager
          .from("categories")
          .insert({
            name: categoryName,
            workspace_id: managerProfile.workspace_id,
          })
          .select("id")
          .single();
        assert.ifError(createError);
        const fixture = trackCategory(category.id, managerProfile.workspace_id);

        const cleanupArgs = {
          p_workspace_id: managerProfile.workspace_id,
          p_category_id: category.id,
        };
        const anonymousRefusal = await anonymousClient.rpc(
          "cleanup_rls_test_category",
          cleanupArgs,
        );
        assert.equal(anonymousRefusal.error?.code, "42501");

        const memberRefusal = await memberA.rpc(
          "cleanup_rls_test_category",
          cleanupArgs,
        );
        assert.equal(memberRefusal.error?.code, "42501");

        const { data: memberBProfile, error: memberBProfileError } = await memberB
          .from("profiles")
          .select("workspace_id")
          .eq("id", sessionB.user.id)
          .single();
        assert.ifError(memberBProfileError);
        const foreignWorkspaceId =
          memberBProfile.workspace_id !== managerProfile.workspace_id
            ? memberBProfile.workspace_id
            : randomUUID();
        assert.notEqual(foreignWorkspaceId, managerProfile.workspace_id);
        const foreignWorkspaceRefusal = await manager.rpc(
          "cleanup_rls_test_category",
          {
            p_workspace_id: foreignWorkspaceId,
            p_category_id: category.id,
          },
        );
        assert.equal(foreignWorkspaceRefusal.error?.code, "42501");

        const { data: workspaceCategories, error: realCategoryError } = await manager
          .from("categories")
          .select("id, name")
          .eq("workspace_id", managerProfile.workspace_id);
        assert.ifError(realCategoryError);
        const realCategory = workspaceCategories.find(
          (entry) => !/^RLS-[0-9a-f-]{36}(-renommée)?$/.test(entry.name),
        );
        assert.ok(realCategory, "une catégorie réelle est disponible");
        const realCategoryRefusal = await manager.rpc(
          "cleanup_rls_test_category",
          {
            p_workspace_id: managerProfile.workspace_id,
            p_category_id: realCategory.id,
          },
        );
        assert.equal(realCategoryRefusal.error?.code, "22023");
        const { data: realCategoryStillThere, error: realCategoryReadError } =
          await manager
            .from("categories")
            .select("id")
            .eq("id", realCategory.id)
            .maybeSingle();
        assert.ifError(realCategoryReadError);
        assert.ok(realCategoryStillThere, "une catégorie réelle reste intacte");

        const { data: resource, error: resourceCreateError } = await memberA
          .from("resources")
          .insert({
            workspace_id: managerProfile.workspace_id,
            category_id: category.id,
            owner_id: sessionA.user.id,
            title: "RLS-TEST-cleanup-" + randomUUID(),
            body: "fixture utilisée pour vérifier la protection de la catégorie",
          })
          .select("id")
          .single();
        assert.ifError(resourceCreateError);
        trackResource(resource.id);
        const usedCategoryRefusal = await manager.rpc(
          "cleanup_rls_test_category",
          cleanupArgs,
        );
        assert.equal(usedCategoryRefusal.error?.code, "23503");
        const { data: usedCategoryStillThere, error: usedCategoryReadError } =
          await manager
            .from("categories")
            .select("id")
            .eq("id", category.id)
            .maybeSingle();
        assert.ifError(usedCategoryReadError);
        assert.ok(usedCategoryStillThere, "une catégorie utilisée reste intacte");
        const { data: usedResourceStillThere, error: usedResourceReadError } =
          await memberA
            .from("resources")
            .select("id")
            .eq("id", resource.id)
            .maybeSingle();
        assert.ifError(usedResourceReadError);
        assert.ok(usedResourceStillThere, "la ressource liée reste intacte");

        const { error: resourceDeleteError } = await memberA
          .from("resources")
          .delete()
          .eq("id", resource.id);
        assert.ifError(resourceDeleteError);

        const { data: deleted, error: deleteError } = await manager.rpc(
          "cleanup_rls_test_category",
          cleanupArgs,
        );
        assert.ifError(deleteError);
        assert.equal(deleted, true);
        fixture.deleted = true;
        const { data: retried, error: retryError } = await manager.rpc(
          "cleanup_rls_test_category",
          cleanupArgs,
        );
        assert.ifError(retryError);
        assert.equal(retried, false);
        const { data: remainingCategory, error: verifyError } = await manager
          .from("categories")
          .select("id")
          .eq("id", category.id)
          .maybeSingle();
        assert.ifError(verifyError);
        assert.equal(remainingCategory, null);
        fixture.verified = true;
      });

      await t.test("resources : lecture anonyme refusee, lecture membre possible, aucune ecriture", async () => {
        const { data: anonData, error: anonError } = await anonymousClient
          .from("resources")
          .select("id")
          .limit(1);
        if (anonError) {
          assert.equal(anonError.code, "42501");
        } else {
          assert.equal(anonData?.length ?? 0, 0);
        }

        const { data: memberProfile, error: profileError } = await memberA
          .from("profiles")
          .select("workspace_id")
          .eq("id", sessionA.user.id)
          .maybeSingle();
        assert.ifError(profileError);
        assert.ok(memberProfile, "le profil du membre doit exister");

        const { data: readable, error: readError } = await memberA
          .from("resources")
          .select("id, title, body, updated_at, categories(name)")
          .eq("workspace_id", memberProfile.workspace_id);
        assert.ifError(readError);
        assert.ok(Array.isArray(readable), "la liste peut etre vide mais doit etre lisible");

        // Sans catégorie du workspace, l'insertion est refusée par la RLS.
        const { error: insertError } = await memberA.from("resources").insert({
          workspace_id: memberProfile.workspace_id,
          category_id: randomUUID(),
          owner_id: sessionA.user.id,
          title: "RLS-interdit-" + randomUUID(),
          body: "interdit",
        });
        assert.equal(insertError?.code, "42501");

        // La modification est couverte par les tests de la story 2.4 (RLS-TEST-2.4-),
        // la suppression par ceux de la story 2.6 (RLS-TEST-2.4-suppression-*).
      });

      await t.test("resources : un membre cree une ressource a son nom, pas au nom d'un autre", async () => {
        const { data: profileA, error: profileAError } = await memberA
          .from("profiles")
          .select("workspace_id")
          .eq("id", sessionA.user.id)
          .maybeSingle();
        assert.ifError(profileAError);
        assert.ok(profileA, "le profil du membre doit exister");

        const { data: category, error: categoryError } = await memberA
          .from("categories")
          .select("id")
          .eq("workspace_id", profileA.workspace_id)
          .limit(1)
          .maybeSingle();
        assert.ifError(categoryError);
        assert.ok(category, "une categorie du workspace doit exister (creee par le responsable)");

        // Les membres ne peuvent pas supprimer : le titre porte un marqueur de test.
        const marker = "RLS-TEST-2.3-" + randomUUID();
        const { data: created, error: createError } = await memberA
          .from("resources")
          .insert({
            workspace_id: profileA.workspace_id,
            category_id: category.id,
            owner_id: sessionA.user.id,
            title: marker,
            body: "ressource de test RLS",
          })
          .select("id, owner_id, title")
          .single();
        assert.ifError(createError);
        assert.equal(created.owner_id, sessionA.user.id);
        assert.equal(created.title, marker);
        trackResource(created.id);

        const { error: otherOwnerError } = await memberA.from("resources").insert({
          workspace_id: profileA.workspace_id,
          category_id: category.id,
          owner_id: sessionB.user.id,
          title: "RLS-TEST-2.3-autre-" + randomUUID(),
          body: "interdit",
        });
        assert.equal(otherOwnerError?.code, "42501");

        const { error: otherWorkspaceError } = await memberA.from("resources").insert({
          workspace_id: randomUUID(),
          category_id: category.id,
          owner_id: sessionA.user.id,
          title: "RLS-TEST-2.3-workspace-" + randomUUID(),
          body: "interdit",
        });
        assert.equal(otherWorkspaceError?.code, "42501");
      });

      async function createTestResource(client, userId, label) {
        const { data: profile, error: profileError } = await client
          .from("profiles")
          .select("workspace_id")
          .eq("id", userId)
          .maybeSingle();
        assert.ifError(profileError);
        assert.ok(profile, "le profil doit exister");
        const { data: category, error: categoryError } = await client
          .from("categories")
          .select("id")
          .eq("workspace_id", profile.workspace_id)
          .limit(1)
          .maybeSingle();
        assert.ifError(categoryError);
        assert.ok(category, "une categorie du workspace doit exister");
        const title = `RLS-TEST-2.4-${label}-${randomUUID()}`;
        const { data: created, error } = await client
          .from("resources")
          .insert({
            workspace_id: profile.workspace_id,
            category_id: category.id,
            owner_id: userId,
            title,
            body: "ressource de test RLS 2.4",
          })
          .select("id, title, body, owner_id, updated_at")
          .single();
        assert.ifError(error);
        trackResource(created.id, client);
        return created;
      }

      await t.test("resources : le proprietaire modifie sa ressource, updated_at augmente", async () => {
        const created = await createTestResource(memberA, sessionA.user.id, "proprietaire");
        await new Promise((resolve) => setTimeout(resolve, 20));

        const newTitle = created.title + "-modifie";
        const { data: updated, error } = await memberA
          .from("resources")
          .update({ title: newTitle, body: "texte modifie" })
          .eq("id", created.id)
          .select("id, title, body, owner_id, updated_at");
        assert.ifError(error);
        assert.equal(updated?.length, 1);
        assert.equal(updated[0].title, newTitle);
        assert.equal(updated[0].body, "texte modifie");
        assert.equal(updated[0].owner_id, sessionA.user.id);
        assert.ok(
          new Date(updated[0].updated_at) > new Date(created.updated_at),
          "updated_at doit augmenter",
        );

        const { error: ownerChangeError } = await memberA
          .from("resources")
          .update({ owner_id: sessionB.user.id })
          .eq("id", created.id);
        assert.ok(ownerChangeError, "owner_id ne doit pas etre modifiable");
      });

      await t.test("resources : un autre membre ne peut pas modifier la ressource", async () => {
        const created = await createTestResource(memberA, sessionA.user.id, "refus");

        const { data: updated, error } = await memberB
          .from("resources")
          .update({ title: "RLS-TEST-2.4-pirate", body: "pirate" })
          .eq("id", created.id)
          .select("id");
        assert.ok(error || (updated?.length ?? 0) === 0, "aucune ligne ne doit etre modifiee");

        const { data: after, error: readError } = await memberA
          .from("resources")
          .select("title, body, updated_at")
          .eq("id", created.id)
          .single();
        assert.ifError(readError);
        assert.equal(after.title, created.title);
        assert.equal(after.body, created.body);
        assert.equal(after.updated_at, created.updated_at);
      });

      await t.test("resources : le responsable modifie la ressource d'un membre", async (managerTest) => {
        if (!managerEmail || !managerPassword) {
          managerTest.skip("RLS_TEST_MANAGER_EMAIL et RLS_TEST_MANAGER_PASSWORD absents : test responsable 2.4 ignore.");
          return;
        }

        const created = await createTestResource(memberA, sessionA.user.id, "responsable");
        const managerClient = createClient(supabaseUrl, publishableKey, clientOptions);
        try {
          const { data: managerSession, error: loginError } =
            await managerClient.auth.signInWithPassword({
              email: managerEmail,
              password: managerPassword,
            });
          assert.ifError(loginError);
          assert.ok(managerSession.user, "le responsable doit avoir une session");

          const newTitle = created.title + "-par-responsable";
          const { data: updated, error } = await managerClient
            .from("resources")
            .update({ title: newTitle })
            .eq("id", created.id)
            .select("id, title, owner_id");
          assert.ifError(error);
          assert.equal(updated?.length, 1);
          assert.equal(updated[0].title, newTitle);
          assert.equal(updated[0].owner_id, sessionA.user.id);
        } finally {
          await managerClient.auth.signOut();
        }
      });

      await t.test("resources : le proprietaire supprime sa ressource", async () => {
        const created = await createTestResource(memberA, sessionA.user.id, "suppression");
        const { data: deleted, error } = await memberA
          .from("resources")
          .delete()
          .eq("id", created.id)
          .select("id");
        assert.ifError(error);
        assert.equal(deleted?.length, 1);

        const { data: after, error: readError } = await memberA
          .from("resources")
          .select("id")
          .eq("id", created.id)
          .maybeSingle();
        assert.ifError(readError);
        assert.equal(after, null);
      });

      await t.test("resources : un autre membre ne peut pas supprimer la ressource", async () => {
        const created = await createTestResource(memberA, sessionA.user.id, "suppression-refus");

        const { data: deleted, error } = await memberB
          .from("resources")
          .delete()
          .eq("id", created.id)
          .select("id");
        assert.ok(error || (deleted?.length ?? 0) === 0, "aucune ligne ne doit etre supprimee");

        const { data: after, error: readError } = await memberA
          .from("resources")
          .select("id, title")
          .eq("id", created.id)
          .maybeSingle();
        assert.ifError(readError);
        assert.equal(after?.title, created.title);
      });

      await t.test("resources : le responsable supprime la ressource d'un membre", async () => {
        const created = await createTestResource(memberA, sessionA.user.id, "suppression-responsable");
        const { data: deleted, error } = await manager
          .from("resources")
          .delete()
          .eq("id", created.id)
          .select("id");
        assert.ifError(error);
        assert.equal(deleted?.length, 1);
      });

      await t.test("searches : l'historique est privé à son propriétaire", async () => {
        const query = `RLS-TEST-${randomUUID()}`;
        const { data: created, error: insertError } = await memberA
          .from("searches")
          .insert({ owner_id: sessionA.user.id, query })
          .select("id");
        assert.ifError(insertError);
        assert.equal(created?.length, 1);
        trackSearch(created[0].id);

        const { data: ownRows, error: ownError } = await memberA
          .from("searches")
          .select("id")
          .eq("query", query);
        assert.ifError(ownError);
        assert.equal(ownRows?.length, 1);

        const { data: otherRows, error: otherError } = await memberB
          .from("searches")
          .select("id")
          .eq("query", query);
        assert.ifError(otherError);
        assert.equal(otherRows?.length, 0);

        const { data: anonymousRows } = await anonymousClient.from("searches").select("id");
        assert.equal(anonymousRows?.length ?? 0, 0);

        const { error: forgedError } = await memberB
          .from("searches")
          .insert({ owner_id: sessionA.user.id, query: `RLS-TEST-${randomUUID()}` });
        assert.ok(forgedError, "un membre ne doit pas écrire dans l'historique d'un autre");
      });

      await t.test("searches : un membre ne supprime pas la recherche d'un autre", async () => {
        const query = `RLS-TEST-${randomUUID()}`;
        const { data: created, error: insertError } = await memberA
          .from("searches")
          .insert({ owner_id: sessionA.user.id, query })
          .select("id");
        assert.ifError(insertError);
        const searchId = created?.[0]?.id;
        assert.ok(searchId);
        trackSearch(searchId);

        const { data: foreignDelete, error: foreignError } = await memberB
          .from("searches")
          .delete()
          .eq("id", searchId)
          .select("id");
        assert.ifError(foreignError);
        assert.equal(foreignDelete?.length, 0);

        const { data: stillThere } = await memberA.from("searches").select("id").eq("id", searchId);
        assert.equal(stillThere?.length, 1);

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
      },
      cleanup: [
        () => runCleanupSteps(resourceCleanup, "des ressources"),
        () => runCleanupSteps(searchCleanup, "des recherches"),
        () => runCleanupSteps(categoryCleanup, "des catégories"),
      ],
      disconnect: [
        async () => {
          const { error } = await anonymousClient.auth.signOut();
          assert.ifError(error);
        },
        async () => {
          const { error } = await memberA.auth.signOut();
          assert.ifError(error);
        },
        async () => {
          const { error } = await memberB.auth.signOut();
          assert.ifError(error);
        },
        async () => {
          const { error } = await manager.auth.signOut();
          assert.ifError(error);
        },
      ],
    });
  },
);
