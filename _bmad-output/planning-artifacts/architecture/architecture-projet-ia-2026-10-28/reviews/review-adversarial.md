# Adversarial architecture review

**Verdict: Not ready for independent module implementation.** Several central contracts are contradictory or leave materially different compliant implementations possible, especially workspace identity, authorization, write ownership, and RAG context. Findings are limited to gaps observable in the spine; “guard” states the decision or invariant needed to close each gap.

## Findings

1. **High — Workspace cardinality conflicts.**  
   **Location:** `ARCHITECTURE-SPINE.md:60, 132–143`  
   **Trigger:** AD-3 specifies a *single* workspace, while the ER diagram models multiple workspaces containing profiles, categories, and resources. A module can implement a singleton workspace; another can require workspace IDs and membership.  
   **Guard:** Decide whether MVP is strictly single-workspace or multi-workspace; make the cardinality, membership relation, and required workspace key consistent across prose, schema, and policies.  
   **Consequence:** Separately built modules disagree on which records belong in the shared corpus and which identifier scopes authorization.

2. **High — `owner_id` does not identify a canonical key.**  
   **Location:** `ARCHITECTURE-SPINE.md:66, 91, 131–143`  
   **Trigger:** `owner_id` is said to identify a member, while the diagram distinguishes `AUTH_USERS` and `PROFILES`; neither the prose nor ERD says whether it references `auth.users.id` or `profiles.id`.  
   **Guard:** Name the canonical principal key and specify each ownership FK and join (including `searches`, `conversations`, and `resources`).  
   **Consequence:** Modules can write the same user under incompatible UUIDs, breaking owner filters, joins, and RLS.

3. **High — The authorization matrix is not a set of enforceable policies.**  
   **Location:** `ARCHITECTURE-SPINE.md:54, 60, 66, 166–171, 183`  
   **Trigger:** RLS is required, but policy behavior is only described broadly. In particular, access checks for chunks and messages through their parents, category deletion, and updates to ownership/workspace fields are not specified.  
   **Guard:** Define per-table SELECT/INSERT/UPDATE/DELETE rules, including immutable columns and parent-row checks for child records; make the role matrix normative.  
   **Consequence:** Two implementations can both enable RLS yet differ on whether users can read or mutate another member’s private history or protected resources.

4. **High — Role assignment has no trusted authority or lifecycle.**  
   **Location:** `ARCHITECTURE-SPINE.md:60, 143`  
   **Trigger:** A profile owner and signup cannot set the role, but no trusted actor, bootstrap process, or role-change procedure is defined.  
   **Guard:** Specify how the initial responsible user is established, who may grant/revoke that role, and how the change is audited and enforced by the database.  
   **Consequence:** Auth and admin modules can provision incompatible roles—or leave the product with no responsible user—or implement an unintended privilege-escalation path.

5. **High — Mutation ownership conflicts between Server Actions and Route Handlers.**  
   **Location:** `ARCHITECTURE-SPINE.md:40, 48, 72, 92, 181`  
   **Trigger:** The paradigm says Server Actions handle writes; AD-1 permits both actions and handlers; the conventions assign RAG to a Route Handler, which also saves conversations, while the assistant map assigns it to a handler. The index write path is likewise not distinguished from resource mutations.  
   **Guard:** State which entry point owns each command (resource CRUD, index publication, search-history write, conversation/message persistence) and where shared validation/authorization lives.  
   **Consequence:** Modules can implement duplicate or bypassable write paths with different validation, authorization, and error semantics.

6. **High — Child-row ownership is not tied explicitly to the parent.**  
   **Location:** `ARCHITECTURE-SPINE.md:66, 140, 143`  
   **Trigger:** A message has only `conversation_id` as its stated parent, and a chunk only `resource_id`; no invariant says the writer/owner/workspace of a child must be authorized through that parent.  
   **Guard:** Require parent-derived authorization and integrity for every child write/read, and prohibit independently supplied child ownership or workspace values unless checked against the parent.  
   **Consequence:** A child-row endpoint can attach content to another person’s conversation or to a resource outside the writer’s permitted scope.

7. **High — Index replacement has no atomic publication contract.**  
   **Location:** `ARCHITECTURE-SPINE.md:66, 143`  
   **Trigger:** A resource edit invalidates old chunks “before” publishing the new index, but no transaction, revision, state machine, or failure/retry behavior is specified.  
   **Guard:** Define a versioned indexing lifecycle and only expose a complete index for the current resource revision; specify rollback/retry and concurrent-edit handling.  
   **Consequence:** A failed or overlapping job can leave no searchable content, publish partial chunks, or restore stale chunks after a newer edit.

8. **High — Resource deletion and vector cleanup can diverge.**  
   **Location:** `ARCHITECTURE-SPINE.md:66, 137, 161`  
   **Trigger:** Deletion is said to remove vector passages, but the schema’s FK/cascade behavior and whether deletion waits for successful cleanup are left to later migrations.  
   **Guard:** Specify transactional cascade or a durable deletion/outbox workflow, including RLS-compatible cleanup and the point at which deletion is considered complete.  
   **Consequence:** Failed cleanup leaves retrievable passages for a deleted resource, or one module reports success while another still exposes its content.

9. **High — RLS behavior for vector retrieval is not pinned to the execution path.**  
   **Location:** `ARCHITECTURE-SPINE.md:54, 72, 93`  
   **Trigger:** Retrieval is described as RLS-limited, but no vector query/RPC contract says it must use the caller’s session or how database functions preserve that identity.  
   **Guard:** Require retrieval to run with the authenticated user context and explicitly scope by the authorized workspace/resource; document safe function privileges and forbid service-role bypass for user retrieval.  
   **Consequence:** A vector-search implementation can return cross-user/workspace chunks even though ordinary table queries honor RLS.

10. **Medium — Resource/category workspace consistency is not enforced.**  
    **Location:** `ARCHITECTURE-SPINE.md:132–137, 143`  
    **Trigger:** The diagram gives both resources and categories workspace membership and links resources to categories, but does not require the category to belong to the same workspace as its resource.  
    **Guard:** Specify a same-workspace invariant and enforce it in the FK/schema or a database constraint/policy.  
    **Consequence:** A resource can be classified using another workspace’s category, causing inconsistent filtering and potentially exposing category metadata.

11. **Medium — RAG source identity is not a stable citation contract.**  
    **Location:** `ARCHITECTURE-SPINE.md:72, 143`  
    **Trigger:** RAG must display corresponding sources and chunks contain text/vector, but the resource fields and chunk schema do not define stable source IDs, links, or passage offsets.  
    **Guard:** Specify the source fields and stable resource/chunk identifiers returned with each retrieved passage, and require displayed citations to derive only from those results.  
    **Consequence:** Independently built retrieval and UI modules can show citations that cannot be resolved to the passage used, or cite a different resource version.

12. **Medium — “Sufficient context” has no shared decision rule.**  
    **Location:** `ARCHITECTURE-SPINE.md:72, 189`  
    **Trigger:** The assistant must abstain without sufficient context, while chunking, similarity threshold, and ranking are deferred; no shared retrieval count, cutoff, or sufficiency behavior is given.  
    **Guard:** Define a minimum RAG interface contract now (authorized result shape and ordering, cutoff/sufficiency signal, and empty-result behavior), even if tuning values remain configurable.  
    **Consequence:** Search and assistant modules can disagree about which passages enter the prompt and when the assistant must abstain.

13. **Medium — Embedding compatibility and reindexing are unspecified.**  
    **Location:** `ARCHITECTURE-SPINE.md:84, 109–111, 189`  
    **Trigger:** The provider/model is provisional and dimensions are stated, but stored vectors have no specified model/version metadata or migration/reindex rule when the model changes.  
    **Guard:** Bind each index to an embedding model/version and define compatibility checks plus a reindex/cutover procedure.  
    **Consequence:** Query embeddings and stored vectors can silently come from incompatible models, degrading or invalidating retrieval.

14. **Medium — Thirty-day history expiry has no operational semantics.**  
    **Location:** `ARCHITECTURE-SPINE.md:66, 91, 143, 170`  
    **Trigger:** Searches and conversations “expire” after 30 days, but the retention clock, cleanup mechanism, message cascade, and deletion guarantee are unspecified.  
    **Guard:** Define the timestamp that starts retention, enforceable cleanup/cascade behavior, and whether expiry means inaccessible or physically deleted.  
    **Consequence:** History and messages can persist for different durations across modules, contradicting the stated lifecycle and privacy expectation.
