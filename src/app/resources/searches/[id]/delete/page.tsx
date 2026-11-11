import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteSearch } from "@/features/resources/search-actions";
import { getSearchForDelete } from "@/features/resources/searches";

export const metadata: Metadata = {
  title: "Supprimer une recherche - NexaMind AI",
  description: "Confirmer la suppression d'une recherche de votre historique.",
};

export const instant = false;

export default async function DeleteSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const result = await getSearchForDelete(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  // Recherche absente ou appartenant à un autre membre : même réponse, sans fuite.
  if (result.status === "not-found") {
    notFound();
  }

  return (
    <main className="auth-page category-page">
      <section
        aria-labelledby="delete-search-title"
        className="auth-card category-card confirmation-card"
      >
        <h1 id="delete-search-title">Supprimer cette recherche&nbsp;?</h1>

        {result.status !== "ok" ? (
          <p className="auth-message auth-message-error" role="alert">
            Cette recherche n&apos;est pas disponible pour le moment.{" "}
            <Link href={`/resources/searches/${id}/delete`}>R&eacute;essayer</Link>
          </p>
        ) : (
          <>
            {error ? (
              <p className="auth-message auth-message-error" role="alert">
                La recherche n&apos;a pas pu &ecirc;tre supprim&eacute;e. R&eacute;essayez.
              </p>
            ) : null}
            <p>
              Voulez-vous vraiment supprimer la recherche{" "}
              <strong>&laquo;&nbsp;{result.search.query || "recherche vide"}&nbsp;&raquo;</strong>&nbsp;?
            </p>
            <form action={deleteSearch.bind(null, result.search.id)} className="resource-delete-actions">
              <button className="button button-destructive" type="submit">
                Confirmer la suppression
              </button>
              <Link className="button button-secondary" href="/resources/searches">
                Annuler
              </Link>
            </form>
          </>
        )}

        <Link className="auth-back" href="/resources/searches">
          Retour &agrave; mes recherches
        </Link>
      </section>
    </main>
  );
}
