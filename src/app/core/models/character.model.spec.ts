// src/app/core/models/character.model.spec.ts
import { Character, PagedResponse } from './character.model';

// Helper to make exhaustive checks compile-time safe
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x as unknown as string}`);
}

describe('Models: Character & PagedResponse', () => {
  it('accepts a valid Character shape', () => {
    const c: Character = {
      id: 1,
      name: 'Rick Sanchez',
      status: 'Alive',
      species: 'Human',
      image: 'https://example.com/rick.png',
    };

    expect(c.id).toBe(1);
    expect(c.name).toBe('Rick Sanchez');
    expect(['Alive', 'Dead', 'unknown']).toContain(c.status);
    expect(typeof c.image).toBe('string');
  });

  it('status union is handled exhaustively (compile-time guarantee)', () => {
    // If you add a new status in the model, this switch will stop compiling
    const labelFor = (status: Character['status']): string => {
      switch (status) {
        case 'Alive':
          return '✅ Alive';
        case 'Dead':
          return '☠️ Dead';
        case 'unknown':
          return '❓ Unknown';
        default:
          return assertNever(status); // ensures exhaustiveness
      }
    };

    expect(labelFor('Alive')).toBe('✅ Alive');
    expect(labelFor('Dead')).toBe('☠️ Dead');
    expect(labelFor('unknown')).toBe('❓ Unknown');
  });

  it('accepts a PagedResponse<Character> with correctly typed info and results', () => {
    const r: PagedResponse<Character> = {
      info: { count: 2, pages: 1, next: null, prev: null },
      results: [
        {
          id: 10,
          name: 'Morty Smith',
          status: 'Alive',
          species: 'Human',
          image: 'https://example.com/morty.png',
        },
        {
          id: 11,
          name: 'Birdperson',
          status: 'Dead',
          species: 'Bird-Person',
          image: 'https://example.com/birdperson.png',
        },
      ],
    };

    expect(r.info.count).toBe(2);
    expect(r.info.pages).toBe(1);
    expect(r.info.next).toBeNull();
    expect(Array.isArray(r.results)).toBe(true);
    expect(r.results.map(x => x.name)).toEqual(['Morty Smith', 'Birdperson']);
  });

  it('works generically with PagedResponse<T> for other item types', () => {
    type Simple = { id: number; value: string };

    const simplePage: PagedResponse<Simple> = {
      info: { count: 1, pages: 1, next: null, prev: null },
      results: [{ id: 1, value: 'foo' }],
    };

    const ids = simplePage.results.map(r => r.id);
    expect(ids).toEqual([1]);
  });
});
