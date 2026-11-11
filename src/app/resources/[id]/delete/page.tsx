import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteResource } from "@/features/resources/resource-actions";
import { getResourceForEdit } from "@/features/resources/resources";

export const metadata: Metadata = {
  title: "Supprimer une ressource - NexaMind AI",
  description: "Confirmer la suppression d'une ressource de l'\u00e9quipe.",
};

export const instant = false;

export default async function DeleteResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const result = await getResourceForEdit(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  // Ressource absente, invisible ou non supprimable : m\u00eame r\u00e9ponse, sans fuite.
  if (result.status === "not-found" || result.status === "forbidden") {
    notFound();
  }

  return (
    <main className="auth-page category-page">
      <section
        aria-labelledby="delete-resource-title"
        className="auth-card category-card confirmation-card"
      >
        <h1 id="delete-resource-title">Supprimer la ressource</h1>

        {result.status !== "ok" ? (
          <p className="auth-message auth-message-error" role="alert">
            Cette ressource n&apos;est pas disponible pour le moment.{" "}
            <Link href={`/resources/${id}/delete`}>R&eacute;essayer</Link>
          </p>
        ) : (
          <>
            {error ? (
              <p className="auth-message auth-message-error" role="alert">
                La ressource n&apos;a pas pu &ecirc;tre supprim&eacute;e. R&eacute;essayez.
              </p>
            ) : null}
            <p>
              Voulez-vous vraiment supprimer la ressource{" "}
              <strong>&laquo;&nbsp;{result.resource.title}&nbsp;&raquo;</strong>&nbsp;?
              Cette action est d&eacute;finitive.
            </p>
            <form action={deleteResource.bind(null, result.resource.id)} className="resource-delete-actions">
              <button className="button button-destructive" type="submit">
                Supprimer d&eacute;finitivement
              </button>
              <Link className="button button-secondary" href={`/resources/${id}`}>
                Annuler
              </Link>
            </form>
          </>
        )}

        <Link className="auth-back" href={`/resources/${id}`}>
          Retour &agrave; la ressource
        </Link>
      </section>
    </main>
  );
}
