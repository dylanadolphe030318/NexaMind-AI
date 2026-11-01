import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatResourceDate } from "@/features/resources/resource-format";
import { SEARCH_MAX_LENGTH, searchResources } from "@/features/resources/resources";

export const metadata: Metadata = {
  title: "Rechercher - NexaMind AI",
  description: "Rechercher des ressources par mots-cl\u00e9s.",
};

export const instant = false;

export default async function SearchResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const raw = typeof q === "string" ? q.trim() : "";
  const submitted = typeof q === "string";
  const tooLong = raw.length > SEARCH_MAX_LENGTH;

  const outcome = raw && !tooLong ? await searchResources(raw) : null;
  if (raw && !tooLong && !outcome) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="search-title" className="auth-card category-card">
        <h1 id="search-title">Rechercher une ressource</h1>

        <form action="/resources/search" className="resource-search-form" method="get" role="search">
          <div className="auth-field">
            <label htmlFor="search-q">Mots recherch&eacute;s (titre ou texte)</label>
            <input defaultValue={raw.slice(0, 300)} id="search-q" name="q" type="search" />
          </div>
          <button className="button button-small" type="submit">
            Rechercher
          </button>
        </form>

        <section aria-label="R&eacute;sultats de la recherche" className="category-list-section">
          {submitted && !raw ? (
            <p className="auth-message auth-message-info" role="status">
              Saisissez au moins un mot pour lancer la recherche.
            </p>
          ) : tooLong ? (
            <p className="auth-message auth-message-error" role="alert">
              La recherche est trop longue ({SEARCH_MAX_LENGTH} caract&egrave;res au maximum).
            </p>
          ) : outcome && outcome.results === null ? (
            <p className="auth-message auth-message-error" role="alert">
              La recherche n&apos;a pas pu aboutir. R&eacute;essayez.
            </p>
          ) : outcome && outcome.results && outcome.results.length === 0 ? (
            <div className="category-empty" role="status">
              <p>Aucun r&eacute;sultat n&apos;a &eacute;t&eacute; trouv&eacute; pour cette recherche.</p>
              <p>Modifiez les mots ci-dessus et relancez la recherche.</p>
            </div>
          ) : outcome && outcome.results ? (
            <>
              <p className="resource-meta" role="status">
                {outcome.results.length} r&eacute;sultat{outcome.results.length > 1 ? "s" : ""}
              </p>
              <ul className="category-list">
                {outcome.results.map((result) => (
                  <li className="category-entry" key={result.id}>
                    <p className="category-name">{result.title}</p>
                    {result.excerpt ? <p className="resource-excerpt">{result.excerpt}</p> : null}
                    <p className="resource-meta">
                      Mise &agrave; jour le {formatResourceDate(result.updatedAt)} &middot;{" "}
                      <Link className="resource-link" href={`/resources/${result.id}`}>
                        Ouvrir la ressource
                      </Link>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <Link className="auth-back" href="/resources">
          Retour aux ressources
        </Link>
      </section>
    </main>
  );
}
