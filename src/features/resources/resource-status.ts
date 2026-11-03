export type ResourceIndexingStatus = "processing" | "ready" | "failed";

const RESOURCE_INDEXING_LABELS: Record<ResourceIndexingStatus, string> = {
  processing: "Préparation en cours",
  ready: "Prête pour la recherche",
  failed: "Préparation en échec",
};

export const RESOURCE_INDEXING_FAILURE_MESSAGE =
  "La préparation de cette ressource a échoué. Vous pouvez la relancer.";

export function getResourceIndexingLabel(
  status: ResourceIndexingStatus,
): string {
  return RESOURCE_INDEXING_LABELS[status];
}

export function canRetryResourceIndexing(
  status: ResourceIndexingStatus,
  canEdit: boolean,
): boolean {
  return status === "failed" && canEdit;
}

export function getResourceIndexingFailureMessage(
  status: ResourceIndexingStatus,
  canRetry: boolean,
): string | null {
  return status === "failed" && canRetry
    ? RESOURCE_INDEXING_FAILURE_MESSAGE
    : null;
}
