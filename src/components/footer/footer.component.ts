import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FooterData } from '../../models/website-data.model';
import { EditableDirective } from '../../directives/editable.directive';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, EditableDirective]
})
export class FooterComponent {
  data = input.required<FooterData>();
  currentYear: number;

  constructor() {
    // Fix: Initialize in constructor to avoid issues with potential server-side rendering.
    this.currentYear = new Date().getFullYear();
  }
}
