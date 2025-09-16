
import { Component, ChangeDetectionStrategy, input, effect, PLATFORM_ID, inject, signal, computed, WritableSignal, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeroData, HeroBanner } from '../../models/website-data.model';
import { EditModeService } from '../../services/edit-mode.service';
import { EditableDirective } from '../../directives/editable.directive';
import { ToastService } from '../../services/toast.service';
import { ImageProcessingService } from '../../services/image-processing.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, EditableDirective],
  host: {
    '(keydown)': 'handleKeyDown($event)',
  },
})
export class HeroComponent implements OnDestroy {
  data = input.required<HeroData>();
  
  private platformId = inject(PLATFORM_ID);
  editModeService = inject(EditModeService);
  private toastService = inject(ToastService);
  private imageProcessingService = inject(ImageProcessingService);
  
  isEditMode = this.editModeService.isEditMode;
  isDraggingOver = signal(false);
  bannerFileInput = viewChild<ElementRef<HTMLInputElement>>('bannerFileInput');
  
  currentIndex = signal(0);
  private autoPlayInterval: any;

  activeBanner = computed(() => this.data()?.banners?.[this.currentIndex()]);
  
  private viewportWidth = signal(isPlatformBrowser(this.platformId) ? window.innerWidth : 1025);
  private desktopRatio = signal<number | null>(null);
  private mobileRatio = signal<number | null>(null);

  displayAspectRatio = computed(() => {
    const banner = this.activeBanner();

    // In edit mode, the view is determined by the toggle. In public mode, by viewport.
    const isMobileView = this.isEditMode()
      ? this.editModeService.currentBannerEditView() === 'mobile'
      : this.viewportWidth() <= 1024;

    // Prioritize mobile view if active and assets exist
    if (isMobileView && banner?.mobileImage && this.mobileRatio()) {
      return this.mobileRatio();
    }

    // Fallback to desktop view if mobile isn't applicable or doesn't have assets
    if (banner?.desktopImage && this.desktopRatio()) {
      return this.desktopRatio();
    }

    // If we're still here, assets might be missing. Provide default ratios.
    // In edit mode, this gives the user a correctly-sized empty box to drop into.
    if (this.isEditMode()) {
        if (isMobileView) return 800 / 600; // Typical mobile banner ratio
        return 1920 / 600; // Typical desktop banner ratio
    }

    // In public mode, use the stored aspect ratio if available to prevent layout shift.
    const storedRatioStr = banner?.aspectRatio;
    if (storedRatioStr) {
        const parts = storedRatioStr.split('/').map(s => Number(s.trim()));
        if (parts.length === 2 && parts[1] !== 0 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return parts[0] / parts[1];
        }
    }

    return 16 / 9; // Final fallback for public view
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoplay();

      // Effect to update viewport width on resize
      effect((onCleanup) => {
          const onResize = () => this.viewportWidth.set(window.innerWidth);
          window.addEventListener('resize', onResize);
          onCleanup(() => window.removeEventListener('resize', onResize));
      });
      
      // Effect to calculate image ratios when URLs change
      effect(() => {
          const banner = this.activeBanner();
          this.calculateAndSetRatio(banner?.desktopImage, this.desktopRatio);
          this.calculateAndSetRatio(banner?.mobileImage, this.mobileRatio);
      });

      // Effect to set initial aspect ratio from image if missing in data
      effect(() => {
        const banner = this.activeBanner();
        // If aspect ratio is missing, calculate it from the available image.
        // This prevents layout shift on first load after an image upload.
        if (this.isEditMode() && banner && !banner.aspectRatio) {
          const imageUrl = banner.desktopImage || banner.mobileImage;
          if (imageUrl) {
            this.setAspectRatio(imageUrl);
          }
        }
      });

      // Effect to safely handle currentIndex when banner list changes
      effect(() => {
        const bannerCount = this.data()?.banners?.length ?? 0;
        if (bannerCount > 0 && this.currentIndex() >= bannerCount) {
          // If current index is out of bounds (e.g. after a deletion), move to the new last slide.
          this.currentIndex.set(bannerCount - 1);
        }
      });
    }
  }
  
  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private startAutoplay(): void {
    this.stopAutoplay(); // Ensure no multiple intervals running
    if (isPlatformBrowser(this.platformId) && !this.isEditMode()) {
      this.autoPlayInterval = setInterval(() => {
        this.nextBanner();
      }, 5000);
    }
  }

  private stopAutoplay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }
  
  nextBanner(): void {
    this.currentIndex.update(i => (i + 1) % this.data().banners.length);
    this.resetAutoplay();
  }

  previousBanner(): void {
    this.currentIndex.update(i => (i - 1 + this.data().banners.length) % this.data().banners.length);
    this.resetAutoplay();
  }
  
  goToBanner(index: number): void {
    this.currentIndex.set(index);
    this.resetAutoplay();
  }

  private resetAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }

  private calculateAndSetRatio(url: string | undefined, ratioSignal: WritableSignal<number | null>): void {
    if (!url || !isPlatformBrowser(this.platformId)) {
        ratioSignal.set(null);
        return;
    }
    const img = new Image();
    img.onload = () => {
        if (img.naturalHeight > 0) {
            ratioSignal.set(img.naturalWidth / img.naturalHeight);
        }
    };
    img.onerror = () => {
        ratioSignal.set(null); // Reset on error
    };
    img.src = url;
  }

  private setAspectRatio(url: string): void {
    const img = new Image();
    img.onload = () => {
      const newAspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      // Check if an update is needed to avoid unnecessary writes
      if (this.activeBanner()?.aspectRatio !== newAspectRatio) {
        this.editModeService.updateHeroBannerAtIndex(this.currentIndex(), { aspectRatio: newAspectRatio });
      }
    };
    img.src = url;
  }

  setBannerAspectRatioFromCurrentImage(): void {
    const type = this.editModeService.currentBannerEditView();
    const banner = this.activeBanner();
    const imageUrl = type === 'desktop' ? banner?.desktopImage : banner?.mobileImage;

    if (!imageUrl) {
        this.toastService.add({ message: `Upload a ${type} banner image first.`, type: 'info' });
        return;
    }

    const img = new Image();
    img.onload = () => {
      const newAspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      if (banner?.aspectRatio !== newAspectRatio) {
        this.editModeService.updateHeroBannerAtIndex(this.currentIndex(), { aspectRatio: newAspectRatio });
        this.toastService.add({ message: `Aspect ratio set from ${type} image.`, type: 'success' });
      } else {
        this.toastService.add({ message: 'Aspect ratio is already up to date.', type: 'info' });
      }
    };
    img.src = imageUrl;
  }

  handleBannerClick(event: Event, link: string | undefined): void {
    if (this.isEditMode()) {
      event.preventDefault();
      return;
    }
    if (!isPlatformBrowser(this.platformId) || !link || !link.startsWith('#')) return;
    
    event.preventDefault();
    const targetElement = document.querySelector(link);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  handleDragOver(event: DragEvent): void {
    if (!this.isEditMode()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(true);
  }

  handleDragLeave(event: DragEvent): void {
    if (!this.isEditMode()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
  }

  async handleDrop(event: DragEvent): Promise<void> {
    if (!this.isEditMode() || !isPlatformBrowser(this.platformId)) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
        this.processAndUploadImage(file);
    } else if (file) {
        this.toastService.add({ message: 'Invalid file type. Please upload an image.', type: 'error' });
    }
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
    const type = this.editModeService.currentBannerEditView();
    const index = this.currentIndex();
    try {
        const webpDataUrl = await this.imageProcessingService.convertImageToWebp(file);
        
        // Also get dimensions to set aspect ratio automatically
        const img = new Image();
        img.onload = () => {
            const aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
            const update: Partial<HeroBanner> = { aspectRatio };
            
            if (type === 'desktop') {
                update.desktopImage = webpDataUrl;
            } else {
                update.mobileImage = webpDataUrl;
            }
            
            this.editModeService.updateHeroBannerAtIndex(index, update);
            this.toastService.add({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} banner updated.`, type: 'success' });
        };
        img.onerror = (err) => {
            console.error('Could not load processed image to get dimensions', err);
            // Fallback to just saving the image without aspect ratio
            const update: Partial<HeroBanner> = {};
            if (type === 'desktop') {
                update.desktopImage = webpDataUrl;
            } else {
                update.mobileImage = webpDataUrl;
            }
            this.editModeService.updateHeroBannerAtIndex(index, update);
            this.toastService.add({ message: 'Banner updated (aspect ratio could not be set).', type: 'info' });
        };
        img.src = webpDataUrl;

    } catch (error) {
        console.error('Image processing failed:', error);
        this.toastService.add({ message: 'Failed to process image.', type: 'error' });
    }
  }

  editImage(): void {
    const type = this.editModeService.currentBannerEditView();
    const banner = this.activeBanner();
    const imageUrl = type === 'desktop' ? banner?.desktopImage : banner?.mobileImage;

    if (!imageUrl) {
        this.toastService.add({ message: `There is no ${type} image to edit.`, type: 'info' });
        return;
    }

    this.editModeService.openImageEditor(imageUrl, type, this.currentIndex());
  }

  replaceImage(): void {
    this.bannerFileInput()?.nativeElement.click();
  }

  removeImage(): void {
    const type = this.editModeService.currentBannerEditView();
    const index = this.currentIndex();
    const update: Partial<HeroBanner> = {};
    if (type === 'desktop') {
      update.desktopImage = undefined;
    } else {
      update.mobileImage = undefined;
    }
    this.editModeService.updateHeroBannerAtIndex(index, update);
  }

  addBanner(): void {
    this.editModeService.addHeroBanner();
    // After adding, jump to the new last slide
    this.currentIndex.set(this.data().banners.length);
  }

  removeCurrentBanner(): void {
    const indexToRemove = this.currentIndex();
    this.editModeService.removeHeroBannerAtIndex(indexToRemove);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEditMode() || (this.data()?.banners?.length ?? 0) <= 1) {
      return;
    }
    
    const target = event.target as HTMLElement;
    if (target.isContentEditable) {
      return;
    }

    let handled = false;
    if (event.key === 'ArrowRight') {
      this.nextBanner();
      handled = true;
    } else if (event.key === 'ArrowLeft') {
      this.previousBanner();
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
