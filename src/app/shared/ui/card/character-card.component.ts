import { Component, input, output } from '@angular/core';
import { NgOptimizedImage, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage],
  templateUrl: './character-card.component.html',
  styleUrls: ['./character-card.component.scss'],
})
export class CharacterCardComponent {
  image = input.required<string>();
  name = input.required<string>();
  subtitle = input<string>('');
  open = output<void>();
}