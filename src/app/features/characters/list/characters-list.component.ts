import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CharactersStore } from '../state/characters.store';
import { Router } from '@angular/router';
import { CharacterCardComponent } from '../../../shared/ui/card/character-card.component';
import { InfiniteScrollDirective } from '../../../shared/directives/infinite-scroll.directive';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-characters-list',
  imports: [
    CommonModule,
    CharacterCardComponent,
    InfiniteScrollDirective,
    ReactiveFormsModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './characters-list.component.html',
  styleUrls: ['./characters-list.component.scss']
  /*styles: [`
    .container { padding: 16px; }
    .grid {
      display: grid; gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
    .spinner { display:flex; justify-content:center; padding: 16px; }
  `]*/
})
export class CharactersListComponent {
  private api = inject(ApiService);
  store = inject(CharactersStore);
  private router = inject(Router);

  searchCtrl = new FormControl('', { nonNullable: true });
  private loadingNext = signal(false);

  constructor() {
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(q => {
        this.store.setQuery(q);
        this.reload();
      });

    this.reload();

    effect(() => {
      this.store.page();
      if (this.loadingNext()) this.fetchPage();
    });
  }

  reload() {
    this.store.setPage(1);
    this.fetchPage(true);
  }

  fetchPage(reset = false) {
    this.store.setLoading();

    this.api.listCharacters(this.store.page(), this.store.q()).subscribe({
        next: res => {
        this.store.hydrateFromApi(res);

        if (reset || this.store.page() === 1) {
            this.store.characters.set(res.results);
        } else {
            this.store.characters.update(old => dedupeById([...old, ...res.results]));
        }

        this.loadingNext.set(false);
        },
        error: () => this.store.setError()
    });
  }

  loadMore() {
    if (this.store.page() < this.store.totalPages() && this.store.status() !== 'loading') {
      this.loadingNext.set(true);
      this.store.setPage(this.store.page() + 1);
    }
  }

  goDetail(id: number) {
    this.router.navigate(['/characters', id]);
  }
}

function dedupeById<T extends { id: number }>(arr: T[]): T[] {
  const map = new Map<number, T>();
  for (const item of arr) map.set(item.id, item);
  return [...map.values()];
}