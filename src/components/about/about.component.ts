import { Component, ChangeDetectionStrategy, input, ElementRef, inject, signal, PLATFORM_ID, viewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AboutData } from '../../models/website-data.model';
import { EditableDirective } from '../../directives/editable.directive';
import { EditModeService } from '../../services/edit-mode.service';
import { ToastService } from '../../services/toast.service';
import { ImageProcessingService } from '../../services/image-processing.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, EditableDirective],
})
export class AboutComponent {
  data = input.required<AboutData>();
  
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  editModeService = inject(EditModeService);
  private toastService = inject(ToastService);
  private imageProcessingService = inject(ImageProcessingService);

  isVisible = signal(false);
  isEditMode = this.editModeService.isEditMode;
  profileImageInput = viewChild<ElementRef<HTMLInputElement>>('profileImageInput');

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

  triggerImageChange(): void {
    this.profileImageInput()?.nativeElement.click();
  }

  handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processAndUploadImage(file);
    }
    input.value = ''; // Reset input
  }

  private async processAndUploadImage(file: File): Promise<void> {
    try {
        this.toastService.add({ message: 'Processing image...', type: 'info' });
        const webpDataUrl = await this.imageProcessingService.convertImageToWebp(file, 800, 0.9);
        this.editModeService.updateAboutImage(webpDataUrl);
        this.toastService.add({ message: `Profile image updated.`, type: 'success' });
    } catch (error) {
        console.error('Image processing failed:', error);
        this.toastService.add({ message: 'Failed to process image.', type: 'error' });
    }
  }
}
