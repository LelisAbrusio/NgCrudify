import { Routes } from '@angular/router';

export const CHARACTER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./list/characters-list.component').then(m => m.CharactersListComponent) },
  { path: 'new', loadComponent: () => import('./form/character-form.component').then(m => m.CharacterFormComponent) },
  { path: ':id', loadComponent: () => import('./detail/character-detail.component').then(m => m.CharacterDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./form/character-form.component').then(m => m.CharacterFormComponent) },
];
