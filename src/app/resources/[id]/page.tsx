import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { formatResourceDate } from "@/features/resources/resource-format";
import { getResourceDetail } from "@/features/resources/resources";

export const metadata: Metadata = {
  title: "Ressource - NexaMind AI",
  description: "Lire une ressource partag\u00e9e de l'\u00e9quipe.",
};

export const instant = false;

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getResourceDetail(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  if (result.status === "not-found") {
    notFound();
  }

  return (
    <main className="auth-page category-page">
      <article aria-labelledby="resource-title" className="auth-card category-card">
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
            <div className="resource-body">{result.resource.body}</div>
          </>
        )}

        <Link className="auth-back" href="/resources">
          Retour aux ressources
        </Link>
      </article>
    </main>
  );
}
