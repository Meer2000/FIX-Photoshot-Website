import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HireMeData } from '../../models/website-data.model';
import { EditModeService } from '../../services/edit-mode.service';
import { EditableDirective } from '../../directives/editable.directive';

@Component({
  selector: 'app-hire-me',
  standalone: true,
  imports: [CommonModule, EditableDirective],
  templateUrl: './hire-me.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HireMeComponent {
  data = input.required<HireMeData>();
  editModeService = inject(EditModeService);
  isEditMode = this.editModeService.isEditMode;

  editLink(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    const newLink = prompt('Enter the new Upwork profile URL:', this.data().buttonLink);
    if (newLink) {
      this.editModeService.updateElementContent('hireMe.buttonLink', newLink);
    }
  }
}
