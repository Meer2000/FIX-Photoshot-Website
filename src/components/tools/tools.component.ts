import { Component, ChangeDetectionStrategy, input, ElementRef, inject, signal, PLATFORM_ID, viewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ToolsData, ToolItem } from '../../models/website-data.model';
import { EditableDirective } from '../../directives/editable.directive';
import { EditModeService } from '../../services/edit-mode.service';
import { ToastService } from '../../services/toast.service';
import { ImageProcessingService } from '../../services/image-processing.service';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, EditableDirective],
})
export class ToolsComponent {
  data = input.required<ToolsData>();

  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  editModeService = inject(EditModeService);
  private toastService = inject(ToastService);
  private imageProcessingService = inject(ImageProcessingService);
  
  isVisible = signal(false);
  isEditMode = this.editModeService.isEditMode;
  toolIconInput = viewChild<ElementRef<HTMLInputElement>>('toolIconInput');
  private itemToUpdateIconId: string | null = null; 

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.isVisible.set(true);
          observer.unobserve(this.elementRef.nativeElement);
        }
      }, { threshold: 0.1 });
      observer.observe(this.elementRef.nativeElement);
    }
  }

  triggerIconChange(event: MouseEvent, itemId: string): void {
    event.stopPropagation();
    this.itemToUpdateIconId = itemId;
    this.toolIconInput()?.nativeElement.click();
  }

  handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.itemToUpdateIconId) {
      this.processAndUploadImage(file, this.itemToUpdateIconId);
    }
    
    // Reset for next use
    input.value = '';
    this.itemToUpdateIconId = null;
  }

  private async processAndUploadImage(file: File, itemId: string): Promise<void> {
    try {
        this.toastService.add({ message: 'Processing icon...', type: 'info' });
        const webpDataUrl = await this.imageProcessingService.convertImageToWebp(file, 160, 0.9);
        this.editModeService.updateElementContent(`tools.items.${this.getItemIndex(itemId)}.iconSrc`, webpDataUrl);
        this.toastService.add({ message: `Icon updated.`, type: 'success' });
    } catch (error) {
        console.error('Icon processing failed:', error);
        this.toastService.add({ message: 'Failed to process icon.', type: 'error' });
    }
  }

  private getItemIndex(id: string): number {
    return this.data().items.findIndex(item => item.id === id);
  }
}
