export interface Character {
  id: number;
  name: string;
  status: 'Alive' | 'Dead' | 'unknown';
  species: string;
  image: string;
  // campos adicionais da API omitidos
}

export interface PagedResponse<T> {
  info: { count: number; pages: number; next: string | null; prev: string | null; };
  results: T[];
}
