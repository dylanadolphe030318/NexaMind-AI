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

export default async function RecentSearchesPage() {
  const outcome = await getRecentSearches();
  if (!outcome) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="searches-title" className="auth-card category-card">
        <h1 id="searches-title">Mes recherches r&eacute;centes</h1>

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
                <li className="category-entry" key={entry.id}>
                  <p className="category-name">{entry.query}</p>
                  <p className="resource-meta">
                    Recherche du {formatResourceDate(entry.createdAt)}
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
