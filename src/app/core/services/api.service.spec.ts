/** @jest-environment jsdom */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import type { Character, PagedResponse } from '../models/character.model';
import { firstValueFrom } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  const BASE = 'https://rickandmortyapi.com/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // ensure no outstanding requests
  });

  it('listCharacters(): builds URL without name when empty and returns a typed page', async () => {
    const mockPage: PagedResponse<Character> = {
      info: { count: 826, pages: 42, next: `${BASE}/character/?page=2`, prev: null },
      results: [
        { id: 1, name: 'Rick Sanchez', status: 'Alive', species: 'Human', image: 'rick.png' },
      ],
    };

    const promise = firstValueFrom(service.listCharacters(1, ''));

    const req = httpMock.expectOne(`${BASE}/character/?page=1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);

    const res = await promise;
    expect(res.info.pages).toBe(42);
    expect(res.results[0].name).toBe('Rick Sanchez');
  });

  it('listCharacters(): appends &name= with URL-encoding when provided', async () => {
    const q = 'rick & morty';
    const expectedUrl = `${BASE}/character/?page=3&name=${encodeURIComponent(q)}`;

    const mockPage: PagedResponse<Character> = {
      info: { count: 3, pages: 1, next: null, prev: null },
      results: [
        { id: 1, name: 'Rick Sanchez', status: 'Alive', species: 'Human', image: 'rick.png' },
        { id: 2, name: 'Morty Smith', status: 'unknown', species: 'Human', image: 'morty.png' },
      ],
    };

    const promise = firstValueFrom(service.listCharacters(3, q));

    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);

    const res = await promise;
    expect(res.results.length).toBe(2);
    expect(res.results[1].name).toBe('Morty Smith');
  });

  it('getCharacter(): requests by id and returns the character', async () => {
    const mock: Character = {
      id: 7,
      name: 'Abradolf Lincler',
      status: 'Dead',
      species: 'Humanoid',
      image: 'abradolf.png',
    };

    const promise = firstValueFrom(service.getCharacter(7));

    const req = httpMock.expectOne(`${BASE}/character/7`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    const res = await promise;
    expect(res.id).toBe(7);
    expect(res.name).toBe('Abradolf Lincler');
  });

  it('propagates HTTP errors from HttpClient', async () => {
    const p = firstValueFrom(service.getCharacter(9999));

    const req = httpMock.expectOne(`${BASE}/character/9999`);
    req.flush(
      { error: 'Not found' },
      { status: 404, statusText: 'Not Found' }
    );

    try {
      await p;
      fail('Expected firstValueFrom to throw on HTTP 404');
    } catch (err: any) {
      expect(err.status).toBe(404);
      expect(err.statusText).toBe('Not Found');
    }
  });
});
