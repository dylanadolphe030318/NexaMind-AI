import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatResourceDate, isUuid } from "@/features/resources/resource-format";
import { getResourceIndexingLabel } from "@/features/resources/resource-status";
import { getResourceListData } from "@/features/resources/resources";

export const metadata: Metadata = {
  title: "Ressources - NexaMind AI",
  description: "Consulter les ressources partag\u00e9es de l'\u00e9quipe.",
};

export const instant = false;

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; deleted?: string | string[] }>;
}) {
  const { category, deleted } = await searchParams;
  const requested = typeof category === "string" && isUuid(category) ? category : undefined;
  const data = await getResourceListData(requested);
  if (!data) {
    redirect("/login");
  }
  const selected = data.categories.find((item) => item.id === requested);
  const filterActive = Boolean(requested);

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="resources-title" className="auth-card category-card">
        <h1 id="resources-title">Ressources</h1>
        <p className="auth-intro">
          Les ressources partag&eacute;es par l&apos;&eacute;quipe.
        </p>

        {deleted === "1" ? (
          <p className="auth-message auth-message-success" role="status">
            La ressource a &eacute;t&eacute; supprim&eacute;e.
          </p>
        ) : null}

        <p>
          <Link className="button button-small" href="/resources/new">
            Ajouter une ressource
          </Link>{" "}
          <Link className="button button-small button-secondary" href="/resources/search">
            Rechercher
          </Link>
        </p>

        {data.categories.length ? (
          <nav aria-label="Filtrer par cat&eacute;gorie" className="resource-filter">
            <ul className="resource-filter-list">
              <li>
                <Link
                  aria-current={filterActive ? undefined : "true"}
                  className="resource-filter-link"
                  href="/resources"
                >
                  Toutes les cat&eacute;gories
                  {filterActive ? "" : " (s\u00e9lectionn\u00e9e)"}
                </Link>
              </li>
              {data.categories.map((item) => (
                <li key={item.id}>
                  <Link
                    aria-current={item.id === requested ? "true" : undefined}
                    className="resource-filter-link"
                    href={`/resources?category=${item.id}`}
                  >
                    {item.name}
                    {item.id === requested ? " (s\u00e9lectionn\u00e9e)" : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

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
                  <div className="resource-meta-row">
                    <span className="resource-badge">
                      <span className="resource-badge-label">Cat&eacute;gorie</span>{" "}
                      {resource.categoryName ?? "Non class\u00e9e"}
                    </span>
                    <span className="resource-meta">
                      Mise &agrave; jour le {formatResourceDate(resource.updatedAt)}
                    </span>
                    <span
                      aria-label={`État de préparation : ${getResourceIndexingLabel(resource.indexingStatus)}`}
                      className={`resource-indexing-status resource-indexing-status-${resource.indexingStatus}`}
                    >
                      {getResourceIndexingLabel(resource.indexingStatus)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="category-empty" role="status">
              {filterActive ? (
                <p>
                  Aucune ressource dans la cat&eacute;gorie{" "}
                  {selected ? `\u00ab ${selected.name} \u00bb` : "demand\u00e9e"}.{" "}
                  <Link className="resource-link" href="/resources">
                    Voir toutes les cat&eacute;gories
                  </Link>
                </p>
              ) : null}
              {filterActive ? null : <p>Aucune ressource n&apos;est disponible pour le moment.</p>}
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
