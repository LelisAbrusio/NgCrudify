// src/app/features/characters/form/character-form.component.ts
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CharactersStore } from '../state/characters.store';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule }        from '@angular/material/card';
import { MatTooltipModule }     from '@angular/material/tooltip';

type Status = 'Alive' | 'Dead' | 'unknown';

@Component({
  standalone: true,
  selector: 'app-character-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,

    // Material
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './character-form.component.html',
  styleUrls: ['./character-form.component.scss'],
})
export class CharacterFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private store = inject(CharactersStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = false;
  id?: number;

  form = this.fb.group({
    name:   this.fb.control<string>('', { validators: [Validators.required, Validators.minLength(2)] }),
    species:this.fb.control<string>('', { validators: [Validators.required] }),
    status: this.fb.control<Status>('unknown', { validators: [Validators.required] }),
    image:  this.fb.control<string>('', { validators: [Validators.required] }),
  });

  // simple placeholder when no valid image yet
  get imagePreview(): string {
    const url = this.form.controls.image.value?.trim();
    return url ? url : 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
        <rect width="100%" height="100%" fill="#151b28"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#8aa0c5" font-family="sans-serif" font-size="22">
          Image preview
        </text>
      </svg>
    `);
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!idParam;
    if (this.isEdit) {
      this.id = Number(idParam);
      const c = this.store.findById(this.id);
      if (c) {
        this.form.setValue({
          name: c.name,
          species: c.species,
          status: c.status as Status,
          image: c.image,
        });
      }
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (this.isEdit && this.id) {
      this.store.updateLocal(this.id, value);
      this.router.navigate(['/characters', this.id]);
    } else {
      const created = this.store.createLocal(value as any);
      this.router.navigate(['/characters', created.id]);
    }
  }

  cancel() {
    if (this.isEdit && this.id) {
      this.router.navigate(['/characters', this.id]);
    } else {
      this.router.navigate(['/characters']);
    }
  }

  // Keyboard shortcuts: Ctrl/Cmd+Enter to Save, Esc to Cancel
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    const metaEnter = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
    if (metaEnter) {
      e.preventDefault();
      this.submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.cancel();
    }
  }

  // Helpers for template validation
  hasError(control: keyof typeof this.form.controls, err: string) {
    const c = this.form.controls[control];
    return c.touched && c.hasError(err);
  }
}
