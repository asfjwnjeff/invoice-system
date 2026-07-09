import entities from "./entities.json";
import relationships from "./relationships.json";
import metrics from "./metrics.json";

export const semanticLayer = {
  entities: entities.entities,
  relationships: relationships.relationships,
  metrics: metrics.metrics,
  findEntity: (nameOrAlias: string) => entities.entities.find((e) => e.name === nameOrAlias || e.aliases.includes(nameOrAlias)),
  findMetric: (name: string) => metrics.metrics.find((m) => m.name === name || m.label === name),
  getRelations: (entityName: string) => relationships.relationships.filter((r) => r.from === entityName || r.to === entityName),
};
