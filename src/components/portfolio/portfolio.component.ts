import { Component, ChangeDetectionStrategy, input, computed, ElementRef, inject, signal, PLATFORM_ID, viewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PortfolioData, PortfolioItem } from '../../models/website-data.model';
import { EditableDirective } from '../../directives/editable.directive';
import { EditModeService } from '../../services/edit-mode.service';
import { LightboxService } from '../../services/lightbox.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, EditableDirective, DragDropModule],
})
export class PortfolioComponent {
  data = input.required<PortfolioData>();
  
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  editModeService = inject(EditModeService);
  private lightboxService = inject(LightboxService);
  private toastService = inject(ToastService);
  
  isVisible = signal(false);
  isEditMode = this.editModeService.isEditMode;
  portfolioFileInput = viewChild<ElementRef<HTMLInputElement>>('portfolioFileInput');
  
  // To keep track of which item's image is being changed
  private itemToUpdateImageId: string | null = null; 

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.isVisible.set(true);
          observer.unobserve(this.elementRef.nativeElement);
        }
      }, { threshold: 0.01 });
      observer.observe(this.elementRef.nativeElement);
    }
  }

  openLightbox(item: PortfolioItem): void {
    if (this.isEditMode() || !item.images || item.images.length === 0) return;
    const imageUrls = item.images.map(img => img.fullImage);
    this.lightboxService.open(imageUrls);
  }

  // --- Edit Mode Actions ---
  
  drop(event: CdkDragDrop<PortfolioItem[]>) {
    const updatedItems = [...this.data().items];
    moveItemInArray(updatedItems, event.previousIndex, event.currentIndex);
    
    // Update order property based on new array index
    const reorderedItems = updatedItems.map((item, index) => ({ ...item, order: index }));
    
    this.editModeService.reorderPortfolio(reorderedItems);
  }

  addItem(): void {
    this.editModeService.addPortfolioItem();
  }
  
  removeItem(event: MouseEvent, id: string): void {
    event.stopPropagation(); // Prevent card click
    if (confirm('Are you sure you want to delete this portfolio item?')) {
      this.editModeService.removePortfolioItem(id);
    }
  }

  triggerImageChange(event: MouseEvent, itemId: string): void {
    event.stopPropagation();
    this.itemToUpdateImageId = itemId;
    this.portfolioFileInput()?.nativeElement.click();
  }

  handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0 && this.itemToUpdateImageId) {
      // Check if all files are images
      const allImages = Array.from(files).every(file => file.type.startsWith('image/'));
      if (!allImages) {
        this.toastService.add({ message: 'Please select only image files.', type: 'error' });
        return;
      }
      this.editModeService.updatePortfolioItemImages(this.itemToUpdateImageId, files);
    }
    
    // Reset for next use
    input.value = '';
    this.itemToUpdateImageId = null;
  }
}
