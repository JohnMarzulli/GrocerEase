export const TOKENS = {
  ListsService: Symbol.for('ListsService'),
} as const;

export type TokenKeys = keyof typeof TOKENS;
