import { Component, ChangeDetectionStrategy, output, input, computed, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { WebsiteData } from '../../models/website-data.model';
import { EditModeService } from '../../services/edit-mode.service';

@Component({
  selector: 'app-floating-edit-bar',
  templateUrl: './floating-edit-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DatePipe],
})
export class FloatingEditBarComponent {
  data = input.required<WebsiteData | null>();
  isDirty = input.required<boolean>();
  isSaving = input.required<boolean>();
  lastSavedAt = input.required<Date | null>();

  saveDraft = output<void>();
  publish = output<void>();
  discard = output<void>();
  exit = output<void>();

  private editModeService = inject(EditModeService);
  isLayoutMenuOpen = signal(false);

  statusText = computed(() => {
    if (this.isSaving()) return 'Saving...';
    if (this.isDirty()) return 'Unsaved Changes';
    if (this.lastSavedAt()) return 'Draft Saved';
    return 'All changes published';
  });

  statusClass = computed(() => {
    if (this.isSaving()) return 'text-blue-600';
    if (this.isDirty()) return 'text-amber-600';
    if (this.lastSavedAt()) return 'text-green-600';
    return 'text-slate-500';
  });

  toggleLayoutMenu(): void {
    this.isLayoutMenuOpen.update(v => !v);
  }

  updateSectionVisibility(path: string, event: Event): void {
    const isEnabled = (event.target as HTMLInputElement).checked;
    this.editModeService.updateElementContent(path, isEnabled);
  }
}
