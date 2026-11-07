import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { formatResourceDate } from "@/features/resources/resource-format";
import type { RelevantPhraseResult } from "@/features/resources/relevant-search-phrase-core";
import { SEARCH_MAX_LENGTH, searchResources } from "@/features/resources/resources";
import { recordSearch } from "@/features/resources/searches";
import { selectRelevantSearchPhrase } from "@/features/resources/relevant-search-phrase";
import { searchResourcePassages } from "@/features/resources/semantic-search";
import {
  SEMANTIC_QUERY_MAX_LENGTH,
  buildPassageExcerpt,
  type SemanticPassage,
} from "@/features/resources/semantic-search-core";

export const metadata: Metadata = {
  title: "Rechercher - NexaMind AI",
  description: "Rechercher des ressources par mots-cl\u00e9s.",
};

export const instant = false;

async function RelevantPhraseSelection({
  question,
  passages,
}: {
  question: string;
  passages: SemanticPassage[];
}) {
  const result: RelevantPhraseResult = await selectRelevantSearchPhrase(question, passages);

  if (result.status === "selected") {
    return (
      <article aria-label="Phrase la plus pertinente" className="category-entry">
        <h3>Phrase la plus pertinente</h3>
        <blockquote>{result.phrase}</blockquote>
        <p className="resource-meta">
          {result.title} &middot;{" "}
          <Link className="resource-link" href={`/resources/${result.resourceId}`}>
            Ouvrir la ressource
          </Link>
        </p>
      </article>
    );
  }

  if (result.status === "none") {
    return (
      <p className="auth-message auth-message-info" role="status">
        Aucune phrase pertinente n&apos;a pu &ecirc;tre s&eacute;lectionn&eacute;e. Les r&eacute;sultats restent
        disponibles ci-dessous.
      </p>
    );
  }

  return (
    <p className="auth-message auth-message-error" role="alert">
      La phrase pertinente n&apos;a pas pu &ecirc;tre s&eacute;lectionn&eacute;e. Les r&eacute;sultats restent
      disponibles ci-dessous. Relancez la recherche pour r&eacute;essayer.
    </p>
  );
}

export default async function SearchResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const raw = typeof q === "string" ? q.trim() : "";
  const submitted = typeof q === "string";
  const tooLong = raw.length > SEMANTIC_QUERY_MAX_LENGTH;
  const keywordTooLong = raw.length > SEARCH_MAX_LENGTH;

  const outcome = raw && !keywordTooLong ? await searchResources(raw) : null;
  const semantic = raw && !tooLong ? await searchResourcePassages(raw) : null;
  if (raw && !tooLong && !semantic) {
    redirect("/login");
  }
  if (outcome?.results || (submitted && !raw)) {
    await recordSearch(raw);
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
        <p className="auth-intro">
          Pour choisir une phrase pertinente, votre question et jusqu&apos;&agrave; cinq passages complets
          (titre et texte) sont envoy&eacute;s &agrave; OpenAI.
        </p>

        <section aria-label="R&eacute;sultats de la recherche" className="category-list-section">
          {submitted && !raw ? (
            <p className="auth-message auth-message-info" role="status">
              Saisissez au moins un mot pour lancer la recherche.
            </p>
          ) : tooLong ? (
            <p className="auth-message auth-message-error" role="alert">
              La recherche est trop longue ({SEMANTIC_QUERY_MAX_LENGTH} caract&egrave;res au maximum).
            </p>
          ) : keywordTooLong ? (
            <p className="auth-message auth-message-info" role="status">
              La recherche par mots-cl&eacute;s est limit&eacute;e &agrave; {SEARCH_MAX_LENGTH} caract&egrave;res.
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

        {semantic?.status === "ok" ? (
          <section aria-labelledby="semantic-title" className="category-list-section">
            <h2 id="semantic-title">Passages trouv&eacute;s par le sens</h2>
            {semantic.passages.length > 0 ? (
              <Suspense
                fallback={
                  <p className="auth-message auth-message-info" role="status">
                    S&eacute;lection de la phrase pertinente...
                  </p>
                }
              >
                <RelevantPhraseSelection passages={semantic.passages} question={raw} />
              </Suspense>
            ) : null}
            {semantic.passages.length === 0 ? (
              <div className="category-empty" role="status">
                <p>
                  Aucun passage pertinent n&apos;a &eacute;t&eacute; trouv&eacute;. Reformulez votre question avec
                  d&apos;autres mots et relancez la recherche.
                </p>
              </div>
            ) : (
              <ul className="category-list">
                {semantic.passages.map((passage, index) => (
                  <li className="category-entry" key={`${passage.resourceId}-${index}`}>
                    <p className="category-name">{passage.title}</p>
                    <p className="resource-excerpt">{buildPassageExcerpt(passage.content)}</p>
                    <p className="resource-meta">
                      <Link className="resource-link" href={`/resources/${passage.resourceId}`}>
                        Ouvrir la ressource
                      </Link>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
        {semantic?.status === "rate-limited" ? (
          <p className="auth-message auth-message-error" role="alert">
            Trop de recherches en peu de temps. R&eacute;essayez dans une minute.
          </p>
        ) : null}

        {semantic?.status === "error" ? (
          <p className="auth-message auth-message-error" role="alert">
            La recherche par le sens n&apos;a pas pu aboutir. R&eacute;essayez dans un instant.
          </p>
        ) : null}

        <Link className="auth-back" href="/resources/searches">
          Mes recherches r&eacute;centes
        </Link>

        <Link className="auth-back" href="/resources">
          Retour aux ressources
        </Link>
      </section>
    </main>
  );
}
