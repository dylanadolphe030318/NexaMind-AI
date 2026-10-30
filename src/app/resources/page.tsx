import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatResourceDate } from "@/features/resources/resource-format";
import { getResourceListData } from "@/features/resources/resources";

export const metadata: Metadata = {
  title: "Ressources - NexaMind AI",
  description: "Consulter les ressources partag\u00e9es de l'\u00e9quipe.",
};

export const instant = false;

export default async function ResourcesPage() {
  const data = await getResourceListData();
  if (!data) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="resources-title" className="auth-card category-card">
        <h1 id="resources-title">Ressources</h1>
        <p className="auth-intro">
          Les ressources partag&eacute;es par l&apos;&eacute;quipe.
        </p>

        <p>
          <Link className="button button-small" href="/resources/new">
            Ajouter une ressource
          </Link>
        </p>

        <section aria-label="Liste des ressources" className="category-list-section">
          {data.resources === null ? (
            <p className="auth-message auth-message-error" role="alert">
              Les ressources ne sont pas disponibles.{" "}
              <Link href="/resources">R&eacute;essayer</Link>
            </p>
          ) : data.resources.length ? (
            <ul className="category-list">
              {data.resources.map((resource) => (
                <li className="category-entry" key={resource.id}>
                  <p className="category-name">
                    <Link className="resource-link" href={`/resources/${resource.id}`}>
                      {resource.title}
                    </Link>
                  </p>
                  <p className="resource-meta">
                    Cat&eacute;gorie : {resource.categoryName ?? "Non class\u00e9e"} &middot; Mise &agrave; jour le{" "}
                    {formatResourceDate(resource.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="category-empty" role="status">
              <p>Aucune ressource n&apos;est disponible pour le moment.</p>
              <p>
                <Link className="resource-link" href="/resources/new">
                  Ajoutez la premi&egrave;re ressource
                </Link>{" "}
                en saisissant son titre et son texte.
              </p>
            </div>
          )}
        </section>

        <Link className="auth-back" href="/dashboard">
          Retour &agrave; l&apos;espace membre
        </Link>
      </section>
    </main>
  );
}
