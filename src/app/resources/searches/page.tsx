import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatResourceDate } from "@/features/resources/resource-format";
import { getRecentSearches } from "@/features/resources/searches";

export const metadata: Metadata = {
  title: "Mes recherches r\u00e9centes - NexaMind AI",
  description: "Retrouver vos recherches r\u00e9centes.",
};

export const instant = false;

export default async function RecentSearchesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string | string[] }>;
}) {
  const { deleted } = await searchParams;
  const outcome = await getRecentSearches();
  if (!outcome) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="searches-title" className="auth-card category-card">
        <h1 id="searches-title">Mes recherches r&eacute;centes</h1>

        {deleted === "1" ? (
          <p className="auth-message auth-message-success" role="status">
            La recherche a &eacute;t&eacute; supprim&eacute;e.
          </p>
        ) : null}

        <section aria-label="Historique des recherches" className="category-list-section">
          {outcome.entries === null ? (
            <p className="auth-message auth-message-error" role="alert">
              L&apos;historique n&apos;a pas pu &ecirc;tre charg&eacute;. R&eacute;essayez.
            </p>
          ) : outcome.entries.length === 0 ? (
            <div className="category-empty" role="status">
              <p>Vous n&apos;avez pas encore fait de recherche.</p>
              <p>
                <Link className="resource-link" href="/resources/search">
                  Rechercher des ressources
                </Link>
              </p>
            </div>
          ) : (
            <ul className="category-list">
              {outcome.entries.map((entry) => (
                <li className="category-entry resource-card" key={entry.id}>
                  <p className="category-name">
                    <Link
                      className="resource-link"
                      href={`/resources/search?q=${encodeURIComponent(entry.query)}`}
                      prefetch={false}
                    >
                      {entry.query || "(recherche vide)"}
                    </Link>
                  </p>
                  <p className="resource-meta">
                    Recherche du {formatResourceDate(entry.createdAt)} &middot;{" "}
                    <Link
                      aria-label={`Supprimer la recherche ${entry.query || "vide"}`}
                      className="resource-link"
                      href={`/resources/searches/${entry.id}/delete`}
                      prefetch={false}
                    >
                      Supprimer
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link className="auth-back" href="/resources/search">
          Rechercher des ressources
        </Link>
        <Link className="auth-back" href="/resources">
          Retour aux ressources
        </Link>
      </section>
    </main>
  );
}
