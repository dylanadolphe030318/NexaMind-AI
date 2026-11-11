import Link from "next/link";

import {
  groupAssistantAnswerSources,
  splitAssistantAnswer,
  type AssistantAnswerSource,
} from "./assistant-answer-core";

export function AssistantAnswer({
  answer,
  sources,
}: {
  answer: string;
  sources: AssistantAnswerSource[];
}) {
  const groups = groupAssistantAnswerSources(sources, answer);
  const groupBySourceId = new Map<string, (typeof groups)[number]>();
  const unavailableIds = new Set<string>();

  for (const source of sources) {
    if (source.status === "unavailable") {
      if (source.sourceId) {
        unavailableIds.add(source.sourceId);
      }
      continue;
    }
    const group = groups.find((candidate) => candidate.resourceId === source.resourceId);
    if (group) {
      groupBySourceId.set(source.sourceId, group);
    }
  }

  const parts = splitAssistantAnswer(answer);

  return (
    <>
      <h2>R&eacute;ponse</h2>
      <p className="assistant-answer">
        {parts.map((part, index) => {
          if (part.type === "text") {
            return part.value.split("\n").map((line, lineIndex) => (
              <span key={`${index}-${lineIndex}`}>
                {lineIndex ? <br /> : null}
                {line}
              </span>
            ));
          }

          const group = groupBySourceId.get(part.sourceId);
          if (!group || unavailableIds.has(part.sourceId)) {
            return (
              <span key={`${index}-${part.sourceId}`} role="status">
                {" "}Source non disponible
              </span>
            );
          }

          const sourceNumber = groups.indexOf(group) + 1;
          return (
            <Link
              className="resource-link"
              href={`/resources/${encodeURIComponent(group.resourceId)}`}
              key={`${index}-${part.sourceId}`}
            >
              Source {sourceNumber}
            </Link>
          );
        })}
      </p>
      {sources.length ? (
        <>
          <h2>Sources</h2>
          <ul aria-label="Sources" className="category-list">
            {groups.map((group, index) => (
              <li key={group.resourceId}>
                <strong>Source {index + 1} — {group.title}</strong>
                {group.evidence.map((evidence) => (
                  <p className="resource-excerpt" key={evidence.sourceId}>
                    {evidence.excerpt}
                  </p>
                ))}
                <Link
                  className="resource-link"
                  href={`/resources/${encodeURIComponent(group.resourceId)}`}
                >
                  Ouvrir la ressource
                </Link>
              </li>
            ))}
            {sources.flatMap((source, index) =>
              source.status === "unavailable"
                ? [(
                  <li key={`unavailable-${source.sourceId ?? index}`}>
                    <p role="status">Source non disponible</p>
                  </li>
                )]
                : [],
            )}
          </ul>
        </>
      ) : null}
    </>
  );
}
