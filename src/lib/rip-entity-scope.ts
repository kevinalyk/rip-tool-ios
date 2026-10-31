// The API is the access-control boundary. The app also hides flagged entities
// if a cached or older API response reaches the screen.

export type ScopedEntity = {
  type?: string | null;
  isCorporate?: boolean;
};

export function isCorporateEntity(entity: ScopedEntity | null | undefined): boolean {
  return entity?.isCorporate === true;
}

export function excludeCorporateEntities<T extends ScopedEntity>(entities: T[]): T[] {
  return entities.filter((entity) => !isCorporateEntity(entity));
}

export function excludeCorporateFeedItems<T extends { entity: ScopedEntity | null }>(items: T[]): T[] {
  return items.filter((item) => !isCorporateEntity(item.entity));
}
