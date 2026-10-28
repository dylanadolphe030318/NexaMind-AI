# Final technology verification — NexaMind AI architecture spine

**Reviewed:** `_bmad-output/planning-artifacts/architecture/architecture-projet-ia-2026-10-28/ARCHITECTURE-SPINE.md`  
**Verification date:** 2026-10-28  
**Scope:** All named framework, runtime, library, platform, database-extension, provider, and model claims; comparison against repository manifests/installed packages and current authoritative documentation. The architecture spine was not edited.

## Verdict

**Verified with two implementation caveats; no named technology/version or provider/model identifier was found to be stale or nonexistent.** The installed framework versions match repository lock state. The proposed Supabase and OpenAI package/model names are real and technically fit the stated use, and the document correctly labels the uninstalled/provider choices as assumptions. Before implementation, make the Node hosting floor explicit and account for vector-index filtering under RLS when validating retrieval quality.

## Findings

### 1. Set the deployment Node.js floor to 22 or higher

**Location:** Stack and hosting deferrals, lines 106, 110, 212.

The local runtime is verifiably Node `v24.18.0` (`node --version`), so the listed development environment is accurate. However, the proposed `@supabase/supabase-js@2.118.0` release declares `engines.node: >=22.0.0` in npm’s official package metadata. Next.js’s current installation guide has a lower minimum of Node 20.9, which is not sufficient to satisfy this Supabase client target. The production host is explicitly still undecided, and the repository does not declare a Node engine constraint. Thus the current local version is compatible, but does not yet guarantee a compatible deployment runtime.

**Recommendation:** Record Node `>=22` as the minimum runtime requirement (or revisit the proposed Supabase client release), and enforce/document it in the runtime and deployment configuration when that is selected.

Sources: [npm metadata: @supabase/supabase-js 2.118.0](https://registry.npmjs.org/%40supabase%2Fsupabase-js/2.118.0); [Next.js installation requirements](https://nextjs.org/docs/app/getting-started/installation).

### 2. Validate pgvector recall with RLS filters and the chosen index

**Location:** AD-5, line 77; retrieval tuning deferral, line 213.

Supabase documents pgvector as its PostgreSQL extension for vector storage and similarity search, and the proposed `text-embedding-3-small` vector length of 1,536 is compatible with the model’s documented default. The fit is valid. One operational edge case should be included in the deferred retrieval tests: Supabase warns that applying filters to approximate IVFFlat/HNSW vector-index searches can yield fewer than the requested number of rows. RLS predicates also constrain which rows a user may retrieve, so recall/top-k behavior must be measured under the actual authorization filters rather than only against unfiltered data. The spine leaves index choice and ranking for testing, so this is a caveat, not a false claim.

**Recommendation:** Include user-scoped RLS cases in the retrieval benchmark; evaluate iterative scans, over-fetching, or exact search where needed to meet the stated top-three recall target.

Sources: [Supabase pgvector guide](https://supabase.com/docs/guides/database/extensions/pgvector); [Supabase RLS guide](https://supabase.com/docs/guides/database/row-level-security).

## Claim-by-claim verification

| Spine claim | Evidence and assessment |
| --- | --- |
| Node.js `24.18.0`, “current environment” (line 110) | **Confirmed locally:** `node --version` returned `v24.18.0`. This is a local runtime observation, not a repository-pinned or deployment guarantee. The proposed Supabase JS package requires Node `>=22`. |
| Next.js App Router `16.4.3` (line 111) | **Confirmed in repository:** `package.json`, `package-lock.json`, and installed `node_modules/next/package.json` all report `16.4.3`. Current Next.js docs support the described App Router and server deployment pattern. |
| React / React DOM `19.3.0` (line 112) | **Confirmed in repository:** manifest, lockfile, and installed packages all report `19.3.0`. Next.js’s current installation guide describes the App Router’s React canary integration and states the declared React packages should still be kept for ecosystem/tooling compatibility; no contradiction found. |
| TypeScript `5.9.3` (line 113) | **Confirmed in repository:** manifest/lockfile and installed TypeScript package report `5.9.3`. Current Next.js installation docs specify a minimum of TypeScript `5.1.0`, so the project version exceeds it. |
| `@supabase/supabase-js` `2.118.0` (line 114) | **Exists; not installed or declared in the repository.** The spine correctly marks it as an assumption. Its npm metadata lists Node `>=22.0.0`; its exact version was also resolved by `npm view`. |
| `@supabase/ssr` `0.12.7` (line 115) | **Exists; not installed or declared in the repository.** Its npm metadata lists a peer dependency on `@supabase/supabase-js` `^2.114.0`, which admits the proposed `2.118.0`. Current Supabase docs prescribe `@supabase/ssr` for cookie-based SSR and describe server clients for Server Components, Server Actions, and Route Handlers. |
| Supabase-managed PostgreSQL, RLS, `vector`/pgvector, and Supabase Cron/`pg_cron` (lines 56, 70, 77, 116–119, 185) | **Supported and suitable for the described architecture.** Official Supabase docs describe RLS as PostgreSQL row authorization; pgvector as the `vector` extension for embeddings/RAG; and Supabase Cron as a managed PostgreSQL module using `pg_cron` that can invoke SQL/functions. No extension/server version is pinned in the repository, and the spine accurately says so. Cron is a plausible mechanism for the proposed periodic expiry purge. |
| Supabase Storage, conditional on file support (line 119; line 214) | **Fit is accurately conditional.** The spine says the text-only MVP does not require Storage and defers confirmation of file support; this aligns with the stated scope rather than asserting an unsupported capability. |
| OpenAI Responses API with `gpt-6-luna` (lines 31, 91, 120) | **Model and endpoint are documented.** OpenAI’s current model page names `gpt-6-luna` as the model ID and lists Responses API as supported. The OpenAI text-generation guide uses the Responses API for direct model requests. The spine accurately marks this provider/model as provisional and defers cost, quotas, and data-processing checks. |
| OpenAI `text-embedding-3-small`, 1,536 dimensions (lines 32, 91, 121) | **Confirmed.** OpenAI’s embeddings guide lists this model, documents the embeddings endpoint, and states its default vector length is 1,536. Supabase pgvector is an appropriate storage/search counterpart. |
| GitHub Pages is static and not a Next.js server runtime (lines 33, 84, 182) | **Confirmed.** GitHub documents Pages as static HTML/CSS/JavaScript hosting. Next.js documents static export separately from server features; the proposed SSR, Proxy/token refresh, Server Actions, and server-side provider calls require an appropriate runtime. The spine correctly treats GitHub as source hosting and leaves execution hosting open. |
| Next.js Server Components, Server Actions, and Supabase SSR/Proxy (lines 41, 49, 56, 165, 182) | **Technology fit confirmed.** Current Next.js docs describe Server Components for server-side data access and secret use; Supabase’s current Next.js SSR guide covers cookie-backed clients, Server Actions, and the Next.js 16 `proxy.ts` convention. The spine’s “Proxy SSR” terminology is current for its stated Next.js 16 version. |

## Evidence links

- [Next.js installation and system requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js static exports and unsupported server features](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Supabase SSR client setup for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase RLS](https://supabase.com/docs/guides/database/row-level-security)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [npm package metadata: @supabase/supabase-js 2.118.0](https://registry.npmjs.org/%40supabase%2Fsupabase-js/2.118.0)
- [npm package metadata: @supabase/ssr 0.12.7](https://registry.npmjs.org/%40supabase%2Fssr/0.12.7)
- [OpenAI GPT-6 Luna model details](https://developers.openai.com/api/docs/models/gpt-6-luna)
- [OpenAI text generation / Responses API](https://developers.openai.com/api/docs/guides/text-generation)
- [OpenAI embeddings and dimensions](https://developers.openai.com/api/docs/guides/embeddings)
- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## Limits

This review verifies named technologies, package versions, and documented capability/fit. It does not validate project-specific RLS policies, benchmark performance, provider contract terms, or deployed production configuration; those remain implementation/deployment work as the spine itself defers them.
