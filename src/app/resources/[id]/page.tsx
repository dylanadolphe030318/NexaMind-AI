import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { formatResourceDate } from "@/features/resources/resource-format";
import {
  canRetryResourceIndexing,
  getResourceIndexingFailureMessage,
  getResourceIndexingLabel,
} from "@/features/resources/resource-status";
import { retryResourceIndexing } from "@/features/resources/resource-actions";
import { getResourceDetail } from "@/features/resources/resources";

export const metadata: Metadata = {
  title: "Ressource - NexaMind AI",
  description: "Lire une ressource partag\u00e9e de l'\u00e9quipe.",
};

export const instant = false;

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preparation?: string | string[] }>;
}) {
  const { id } = await params;
  const { preparation } = await searchParams;
  const result = await getResourceDetail(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  if (result.status === "not-found") {
    notFound();
  }
  const canRetry =
    result.status === "ok" &&
    canRetryResourceIndexing(result.resource.indexingStatus, result.canEdit);
  const failureMessage =
    result.status === "ok"
      ? getResourceIndexingFailureMessage(result.resource.indexingStatus, canRetry)
      : null;

  return (
    <main className="auth-page category-page">
      <article aria-labelledby="resource-title" className="auth-card category-card">
        {preparation === "launched" ? (
          <p className="auth-message auth-message-success" role="status">
            La pr&eacute;paration a &eacute;t&eacute; relanc&eacute;e.
          </p>
        ) : null}
        {preparation === "denied" ? (
          <p className="auth-message auth-message-error" role="alert">
            Vous ne pouvez pas relancer la pr&eacute;paration de cette ressource.
          </p>
        ) : null}
        {result.status === "error" ? (
          <>
            <h1 id="resource-title">Ressource</h1>
            <p className="auth-message auth-message-error" role="alert">
              Cette ressource n&apos;est pas disponible.{" "}
              <Link href={`/resources/${id}`}>R&eacute;essayer</Link>
            </p>
          </>
        ) : (
          <>
            <h1 id="resource-title">{result.resource.title}</h1>
            <p className="resource-meta">
              Cat&eacute;gorie : {result.resource.categoryName ?? "Non class\u00e9e"} &middot; Mise &agrave; jour le{" "}
              {formatResourceDate(result.resource.updatedAt)}
            </p>
            <p className="resource-meta">
              <span
                aria-label={`État de préparation : ${getResourceIndexingLabel(result.resource.indexingStatus)}`}
                className={`resource-indexing-status resource-indexing-status-${result.resource.indexingStatus}`}
              >
                {getResourceIndexingLabel(result.resource.indexingStatus)}
              </span>
            </p>
            {failureMessage ? (
              <div className="resource-preparation-error">
                <p className="auth-message auth-message-error" role="alert">
                  {failureMessage}
                </p>
                <form action={retryResourceIndexing.bind(null, id)}>
                  <button className="button button-small" type="submit">
                    Relancer la pr&eacute;paration
                  </button>
                </form>
              </div>
            ) : null}
            <div className="resource-body">{result.resource.body}</div>
            {result.canEdit ? (
              <p>
                <Link className="button" href={`/resources/${id}/edit`}>
                  Modifier
                </Link>{" "}
                <Link className="button button-secondary" href={`/resources/${id}/delete`}>
                  Supprimer
                </Link>
              </p>
            ) : null}
          </>
        )}

        <Link className="auth-back" href="/resources">
          Retour aux ressources
        </Link>
      </article>
    </main>
  );
}
