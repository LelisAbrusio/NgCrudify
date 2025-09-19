import { Component, Inject, Optional, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, switchMap, take } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { CharactersStore } from '../state/characters.store';

export type CharacterDetailData = {
  id: number;
  name: string;
  status: 'Alive' | 'Dead' | 'unknown';
  species: string;
  image: string;
};

@Component({
  standalone: true,
  selector: 'app-character-detail',
  imports: [CommonModule, MatButtonModule, RouterLink],
  templateUrl: './character-detail.component.html',
  styleUrls: ['./character-detail.component.scss'],
})
export class CharacterDetailComponent implements OnInit {
  entering = signal(true);

  constructor(
    @Optional() private ref: MatDialogRef<CharacterDetailComponent> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: CharacterDetailData | null,
  ) {}

  private route = inject(ActivatedRoute);
  private store = inject(CharactersStore);
  private api = inject(ApiService);
  private router = inject(Router);

  ngOnInit() {
    if (this.data) {
      queueMicrotask(() => this.entering.set(false));
      return;
    }

    this.route.paramMap.pipe(
      take(1),
      switchMap(pm => {
        const id = Number(pm.get('id') ?? NaN);
        if (!Number.isFinite(id)) return of(null);
        return of(this.store.findById(id)).pipe(
          switchMap(local => (local ? of(local) : this.api.getCharacter(id)))
        );
      })
    ).subscribe(char => {
      if (char) {
        this.data = {
          id: (char as any).id,
          name: (char as any).name,
          status: (char as any).status,
          species: (char as any).species,
          image: (char as any).image,
        };
      }
      this.entering.set(false);
    });
  }

  async remove(id: number) {
    const ok = typeof confirm === 'function'
      ? confirm('Confirm deletion?')
      : true;
    if (!ok) return;

    this.store.deleteLocal(id);

    // If opened as dialog, just close. If routed, go back to list.
    if (this.ref) {
      this.ref.close();
    } else {
      this.router.navigate(['/characters']);
    }
  }

  close() {
    if (this.ref) this.ref.close();    // dialog mode
    else this.router.navigate(['/characters']); // routed mode
  }
}
