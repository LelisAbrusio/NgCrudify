import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'characters',
    pathMatch: 'full'
  },
  {
    path: 'characters',
    loadChildren: () => import('./features/characters/characters.routes')
      .then(m => m.CHARACTER_ROUTES)
  },
  { path: '**', redirectTo: 'characters' },
];
