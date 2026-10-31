// Keep this fallback aligned with CORPORATE_ENTITY_TYPES in the web API.
// The API is the access-control boundary; this prevents stale mobile responses
// from displaying corporate entities while the app refreshes.
const CORPORATE_ENTITY_TYPES = new Set(['media', 'retail']);

export type ScopedEntity = {
  type?: string | null;
  isCorporate?: boolean;
};

export function isCorporateEntity(entity: ScopedEntity | null | undefined): boolean {
  return entity?.isCorporate === true ||
    CORPORATE_ENTITY_TYPES.has(entity?.type?.trim().toLowerCase() || '');
}

export function excludeCorporateEntities<T extends ScopedEntity>(entities: T[]): T[] {
  return entities.filter((entity) => !isCorporateEntity(entity));
}

export function excludeCorporateFeedItems<T extends { entity: ScopedEntity | null }>(items: T[]): T[] {
  return items.filter((item) => !isCorporateEntity(item.entity));
}

export function excludeCorporateEntityTypes<T extends { value: string }>(options: T[]): T[] {
  return options.filter((option) => !CORPORATE_ENTITY_TYPES.has(option.value.trim().toLowerCase()));
}
