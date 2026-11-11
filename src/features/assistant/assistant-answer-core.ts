export type AssistantAnswerSource =
  | {
    status: "available";
    sourceId: string;
    resourceId: string;
    title: string;
    excerpt: string;
  }
  | { status: "unavailable"; sourceId?: string };

export type AssistantAnswerSourceGroup = {
  resourceId: string;
  title: string;
  evidence: Array<{ sourceId: string; excerpt: string }>;
};

export type AssistantAnswerPart =
  | { type: "text"; value: string }
  | { type: "source"; sourceId: string };

export function groupAssistantAnswerSources(
  sources: AssistantAnswerSource[],
  answer = "",
): AssistantAnswerSourceGroup[] {
  const groups = new Map<string, AssistantAnswerSourceGroup>();
  const resourceBySourceId = new Map<string, string>();
  const evidenceOrder = new Map<string, number>();
  const references = assistantAnswerSourceReferences(answer);

  for (const [index, sourceId] of references.entries()) {
    evidenceOrder.set(sourceId, index);
  }

  for (const source of sources) {
    if (source.status !== "available") {
      continue;
    }

    const group = groups.get(source.resourceId) ?? {
      resourceId: source.resourceId,
      title: source.title,
      evidence: [],
    };
    if (!group.evidence.some((item) => item.sourceId === source.sourceId)) {
      group.evidence.push({ sourceId: source.sourceId, excerpt: source.excerpt });
    }
    groups.set(source.resourceId, group);
    resourceBySourceId.set(source.sourceId, source.resourceId);
  }

  const preferredResourceOrder = [...new Set(
    references.flatMap((sourceId) => {
      const resourceId = resourceBySourceId.get(sourceId);
      return resourceId ? [resourceId] : [];
    }),
  )];
  const remaining = [...groups.keys()]
    .filter((resourceId) => !preferredResourceOrder.includes(resourceId))
    .sort((left, right) => left.localeCompare(right));
  const orderedResourceIds = [...preferredResourceOrder, ...remaining];

  return orderedResourceIds
    .map((resourceId) => groups.get(resourceId)!)
    .map((group) => ({
      ...group,
      evidence: [...group.evidence].sort((left, right) =>
        (evidenceOrder.get(left.sourceId) ?? Number.MAX_SAFE_INTEGER) -
        (evidenceOrder.get(right.sourceId) ?? Number.MAX_SAFE_INTEGER) ||
        left.sourceId.localeCompare(right.sourceId)
      ),
    }))
}

export function splitAssistantAnswer(answer: string): AssistantAnswerPart[] {
  const marker = /\[\[source:([^\]]+)\]\]/gi;
  const parts: AssistantAnswerPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = marker.exec(answer)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: answer.slice(lastIndex, match.index) });
    }
    parts.push({ type: "source", sourceId: match[1] });
    lastIndex = marker.lastIndex;
  }

  if (lastIndex < answer.length) {
    parts.push({ type: "text", value: answer.slice(lastIndex) });
  }
  return parts;
}

export function assistantAnswerSourceReferences(answer: string): string[] {
  return [...new Set(
    splitAssistantAnswer(answer)
      .filter((part): part is Extract<AssistantAnswerPart, { type: "source" }> => part.type === "source")
      .map((part) => part.sourceId),
  )];
}
