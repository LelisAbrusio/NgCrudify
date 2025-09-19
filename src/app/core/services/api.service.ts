import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PagedResponse, Character } from '../models/character.model';

const BASE = 'https://rickandmortyapi.com/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  listCharacters(page = 1, name = '') {
    const url = `${BASE}/character/?page=${page}${name ? `&name=${encodeURIComponent(name)}` : ''}`;
    return this.http.get<PagedResponse<Character>>(url);
  }

  getCharacter(id: number) {
    return this.http.get<Character>(`${BASE}/character/${id}`);
  }
  // Sem POST/PUT/DELETE na API pública; CRUD local será no store
}
