# PRD Quality Review — NexaMind AI

## Overall verdict

This PRD is a substantial, readable foundation: it has named user journeys, contiguous functional requirements with criteria, explicit non-goals, assumptions, and counter-metrics. It is not yet a reliable green-light for detailed design or implementation: the product's primary purpose is split between a knowledge-work product and an educational Vibe Coding demonstration, while key choices about accounts, permissions, file ingestion, AI evaluation, and scope remain unresolved or internally inconsistent.

## Decision-readiness — thin

The document tells a team what broad experience to demonstrate, but does not yet resolve which outcome governs trade-offs. §1 and §7.1 treat both knowledge retrieval for small businesses/teams and demonstrating the team's Vibe Coding process as product goals; §8 measures successful product flows, not whether the educational objective is met. Several open questions in §9 affect the design and feasibility of core requirements, despite the claim that they do not block MVP definition.

### Findings

- **high — Choose the MVP's primary outcome (§1, §7.1, §8):** The PRD alternates between solving knowledge-retrieval needs for external teams and demonstrating an educational process to challenge evaluators. Neither is explicitly primary, and no tie-break rule says what gets cut when they conflict. *Fix:* State whether this is primarily a learning/demo artifact or a product MVP; name the primary user and the one outcome that wins scope and quality trade-offs, then add a measure for that outcome.
- **high — Resolve decisions that block design (§5.1, §5.2 FR-3, §5.5 FR-10, §9):** Organization isolation, allowed file types, and account provisioning are open, while workspace behavior, PDF import, role checks, and sign-up are already specified. These are not merely implementation details: they change onboarding, data boundaries, UX, and security. *Fix:* Mark each as a decision required before design/build, select a demo-safe default, and align the requirements and non-goals to that choice.
- **medium — State the evidence behind the problem and target (§1–2):** The document describes plausible knowledge-retrieval pain but does not identify challenge evidence, observed user input, or why this audience is the right one. The reader cannot distinguish validated needs from a convenient product premise. *Fix:* Add a short evidence/source note and label unvalidated claims as assumptions; if there was no discovery, state that explicitly.

## Substance over theater — adequate

The user journeys and FR criteria generally connect the sections to concrete product behavior, and the PRD does not make unsupported novelty claims. The “responsable,” “contributeur,” and “membre” distinctions, however, currently read more like a complete role model than the requirements actually define. The four user labels do not yet establish four different permissions or decision-driving needs.

### Findings

- **medium — Keep personas tied to real distinctions (§2.1, §3, §5.5):** The four named user types are used in journeys, but the PRD only defines two system roles and does not say whether “contributeur” is a permission level or a member who happens to add content. This makes the apparent persona coverage look more complete than the behavior model. *Fix:* Either map each user type to an explicit role/capability and distinct need, or collapse the types that do not change product decisions.

## Strategic coherence — thin

The feature set has a coherent knowledge workflow—add, index, search, ask, verify, revisit—and the metrics broadly follow it. The MVP's learning/demo objective is not operationalized, however, and optional scope is not stable enough to support prioritization. The current measures can show that flows work, but not that the PRD's educational or end-user thesis succeeds.

### Findings

- **high — Measure the declared educational objective (§1, §7.1, §8):** “Cadrage, génération, tests, corrections et itérations observables” is an explicit MVP deliverable, but SM-1–SM-6 measure account access, retrieval, RAG, history, and evaluator task completion only. *Fix:* If learning is primary, define an observable learning/demonstration outcome and how it is assessed; if it is only presentation context, remove it from product success and scope.
- **medium — Make summary scope a real decision (§5.3 FR-8, §7.1, §9):** FR-8 is described as included, then conditional on schedule and secondary to RAG; §7.1 lists it as included, while §9 still asks whether it is prioritized. Its output criteria also do not define what qualifies as a useful summary. *Fix:* Decide and consistently label it Must/Should/Not in MVP; if retained, define a bounded output expectation and a small acceptance check.

## Done-ness clarity — thin

The PRD is stronger than a capability-only brief: each FR has criteria and several failure states are covered. Yet multiple acceptance conditions rely on subjective terms or leave the evaluator/protocol undefined. Downstream story creation would have to invent important thresholds, especially for retrieval quality, abstention, and performance.

### Findings

- **high — Make RAG correctness and abstention reproducible (§5.3 FR-7, §8 SM-4, SM-C1):** “Passage suffisant,” “réponse concise,” “pertinente,” and “source correcte” lack a decision rule. The 10-question set, three unanswered questions, and unspecified evaluator do not define how to handle borderline answers, partial support, or conflicting sources. *Fix:* Define a small fixed test set with expected supporting sources, an answerability/abstention rule, scoring rubric, and evaluator protocol; specify what counts as an unsupported claim.
- **medium — Define search acceptance, not just a plausible result (§5.3 FR-6, §8 SM-3):** “Une ressource pertinente lorsqu’elle existe” does not establish relevance, tie handling, or what happens when several resources match; SM-3's 8/10 threshold is testable only after “pertinente” is defined. *Fix:* Provide a small query-to-relevant-resource benchmark and the rule for passing top-three results, including how the test handles multiple valid resources.
- **medium — Specify indexing state transitions (§5.2 FR-5):** The text says content is prepared, chunked, vectorized, and made searchable, but criteria do not define when an edit becomes authoritative, what a user sees during re-indexing, or what happens to old vectors after a partial failure or retry. “L’ancienne version” must not appear is not a complete lifecycle rule. *Fix:* Define observable states (pending/ready/failed), whether search can return the prior version during re-indexing, and the success/failure outcome of retry.
- **medium — Make performance checks repeatable (§6):** The latency goals specify a corpus size and percentile but not the start/end event, test environment, concurrency, network assumptions, or how provider latency is treated. “Hors incident du fournisseur IA” is not an observable exclusion rule. *Fix:* Define the measurement boundaries and test conditions, and explicitly state how provider errors/timeouts count.

## Scope honesty — thin

The explicit non-goals are useful and appropriately reject enterprise integrations and production guarantees. However, the included feature list still covers authentication, role management, PDF ingestion, two search modes, RAG, summaries, history, responsive/accessibility expectations, and performance targets for an educational MVP without a stated timebox or a sharply defined demo path. A few “included” behaviors depend on unresolved choices.

### Findings

- **high — Reconcile file-ingestion scope (§3 UJ-2, §5.2 FR-3, §7.1–7.2, §9):** FR-3 requires text entry/paste and says PDF import is an assumption; §9 leaves file types and sizes open, while §7.2 excludes formats except those “explicitly retained.” The implementation boundary for one of the core content paths is therefore undecided. *Fix:* Choose a single demonstrable input mode and exact supported file type/size limits; align the journey, FR, included/excluded lists, and open questions.
- **medium — Bound the MVP to a feasible demo slice (§1, §5, §7):** The PRD defines a broad multi-user application but gives no delivery constraint, required evaluator scenario, or explicit cut order beyond RAG before summary. That leaves too much room for the team to interpret “MVP” differently. *Fix:* Add the time/resource constraint if known and name the shortest Must-pass end-to-end demo; classify remaining FRs as Must/Should/Could or identify their fallback.
- **medium — Decide data deletion and retention for demo accounts (§6, §9):** The PRD handles accounts, resources, searches, and conversations but leaves retention and permanent deletion undefined. Saying challenge data should be fictitious or authorized does not address removing test data or closing a demo account. *Fix:* Set a simple demo retention/deletion rule or explicitly state that deletion is out of scope and how test data is reset.

## Downstream usability — adequate

The PRD has a useful glossary, separate UJs and FRs, contiguous FR/SM identifiers, and direct cross-references that make it easier to turn into design and stories. The terminology and metrics still contain mismatches that downstream consumers could silently turn into different implementations.

### Findings

- **high — Define a permission model before using “authorized” (§2.1, §5.1, §5.5 FR-10):** The PRD says there are manager/member roles, but a contributor is not mapped to either; it does not define resource visibility or how a resource becomes forbidden to a member. At the same time FR-10 requires filtering those resources from lists, search, sources, AI context, and direct access. *Fix:* Define the MVP's role-to-action matrix and resource visibility rule (for example, all workspace resources are shared, or a specific owner/visibility grant); state the identity/workspace boundary and use that model consistently in every retrieval path.
- **medium — Align account creation with the demo onboarding journey (§3 UJ-3, §5.1 FR-1, §5.5 FR-10):** FR-1 allows a visitor to create an account, but FR-10 says demo accounts are created by a responsible person and invitations are not provided. A new arrival cannot follow UJ-3 unless an unstated provisioning path exists. *Fix:* Choose self-registration, pre-seeded accounts, or a manager-created account flow; specify how the named new arrival receives access and update FR-1/UJ-3 accordingly.
- **medium — Define what history contains and what can be reopened (§3 UJ-4, §5.4 FR-9, §8 SM-5):** The UJ and FR promise history of both searches and conversations, but the criteria only require recording a search/conversation and reopening a conversation with ordered messages. They do not say whether a search is reopenable, what “recent” means, or how many entries are retained. *Fix:* Enumerate persisted item types and required actions for each; define a retention/window or state that the list is unbounded for the demo.

## Shape fit — adequate

For a user-facing, multi-user AI web product, named protagonists and end-to-end user journeys are appropriate, and the PRD is not over-formalized with a large story catalog. The two-user/one-workspace demo assumption could fit an educational MVP, but the product still borrows multi-organization and team-knowledge language without defining the narrower demonstration boundary. The role and onboarding gaps above are especially important because this is explicitly a multi-user product.

### Findings

- **medium — Match the product shape to the single-workspace demonstration (§1–3, §5.1, §7):** The market framing implies independent teams and small businesses, while the actual MVP excludes multiple organizations and assumes a shared demo workspace. This is a legitimate prototype shape, but it does not say whether accounts represent one shared cohort or separate customer workspaces. *Fix:* Name the demo's actual participant/group model and mark broader team/organization support as future scope; ensure user journeys do not imply excluded onboarding or isolation.

## Mechanical notes

- **No addendum is present** in the PRD workspace; this review covers `prd.md`.
- **ID continuity:** FR-1–FR-10, SM-1–SM-6, and SM-C1–SM-C3 are unique and contiguous. However, SM-5 claims to validate both FR-9 and FR-10 while measuring only same-user conversation reopening; it does not test role-based resource access. SM-6 says it validates FR-1–FR-10, but its evaluator flow omits resource modification, role restrictions, and the optional summary. Narrow those cross-references or add the missing checks.
- **Assumptions index:** The inline assumptions are generally indexed. The FR-3 index entry calls title/content validation an assumption, but the criteria state that validation as a requirement without an inline `[ASSUMPTION]` marker; align the tag/index treatment.
- **Glossary/role terminology:** “Responsable,” “membre,” and “contributeur” are used as if they were roles, but only the first two are described as system roles. Add the role definitions and capability terms once the permission model is chosen.
- **User journeys:** UJ-1 through UJ-4 each name a protagonist; this is a good fit for a UX-driven application.
- **Required sections:** Vision, users, journeys, glossary, functional requirements, quality concerns, MVP boundaries, success measures, open questions, and assumptions are present. The main gap is not section presence but unresolved decisions and criteria that remain difficult to verify.
