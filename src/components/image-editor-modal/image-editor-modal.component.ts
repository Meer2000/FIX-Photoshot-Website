import { Component, ChangeDetectionStrategy, input, output, viewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

// This will be defined when the script is dynamically loaded.
declare var Cropper: any;

@Component({
  selector: 'app-image-editor-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-editor-modal.component.html',
  styleUrls: ['./image-editor-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class ImageEditorModalComponent implements AfterViewInit, OnDestroy {
  imageData = input.required<string>();
  
  save = output<string>();
  close = output<void>();

  imageElement = viewChild<ElementRef<HTMLImageElement>>('image');
  
  isLoading = signal(true);
  isError = signal(false);
  private cropper: any; // Cropper instance
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  ngAfterViewInit(): void {
    this.initEditor();
  }
  
  private initEditor(): void {
    this.loadDependencies().then(() => {
      this.isError.set(false); // Reset error state on success/retry
      this.initializeCropperInstance();
    }).catch(err => {
      console.error('Cropper.js failed to load.', err);
      this.toastService.add({
        message: 'Image editor resources failed to load. Check your connection.',
        type: 'error',
        duration: 6000
      });
      this.setErrorState();
    });
  }

  private loadDependencies(): Promise<void> {
    // If the library is already available, we're done.
    if (typeof Cropper !== 'undefined') {
      return Promise.resolve();
    }

    // Use a promise on the window object to prevent multiple concurrent loads.
    if ((window as any)._cropperPromise) {
      return (window as any)._cropperPromise;
    }

    (window as any)._cropperPromise = new Promise<void>((resolve, reject) => {
      // Load CSS
      const cssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
      if (!document.querySelector(`link[href="${cssUrl}"]`)) {
        const styleElement = document.createElement('link');
        styleElement.rel = 'stylesheet';
        styleElement.href = cssUrl;
        document.head.appendChild(styleElement);
      }

      // Load Script
      const scriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
      const scriptElement = document.createElement('script');
      scriptElement.src = scriptUrl;
      scriptElement.onload = () => resolve();
      scriptElement.onerror = (error) => {
        // On error, delete the promise to allow retries.
        delete (window as any)._cropperPromise;
        scriptElement.remove();
        reject(error);
      };
      document.body.appendChild(scriptElement);
    });
    
    return (window as any)._cropperPromise;
  }

  retryInit(): void {
    this.isError.set(false);
    this.isLoading.set(true);
    this.cdr.detectChanges();
    this.initEditor();
  }

  private initializeCropperInstance(): void {
    const imageEl = this.imageElement()?.nativeElement;
    if (!imageEl) {
      console.error('Image element not found for Cropper initialization.');
      this.toastService.add({ message: 'Internal error: Could not find image element.', type: 'error' });
      this.setErrorState();
      return;
    }

    const setupCropper = () => {
      try {
        if (this.cropper) {
          this.cropper.destroy();
        }
        this.cropper = new Cropper(imageEl, {
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 0.8,
          restore: false,
          modal: false,
          guides: false,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false,
          ready: () => {
            this.isLoading.set(false);
            this.cdr.detectChanges();
          }
        });
      } catch (e) {
        console.error("Cropper.js failed to initialize.", e);
        this.toastService.add({ message: 'Image editor failed to initialize.', type: 'error' });
        this.setErrorState();
      }
    };

    if (imageEl.complete) {
      setupCropper();
    } else {
      imageEl.onload = setupCropper;
      imageEl.onerror = () => {
        console.error("Image failed to load for cropping.");
        this.toastService.add({ message: 'The selected image could not be loaded.', type: 'error' });
        this.setErrorState();
      };
    }
  }

  private setErrorState(): void {
    this.isLoading.set(false);
    this.isError.set(true);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.cropper) {
      this.cropper.destroy();
    }
  }

  onEscapeKey(): void {
    this.close.emit();
  }

  // --- Cropper Actions ---
  zoom(factor: number): void { this.cropper?.zoom(factor); }
  rotate(degrees: number): void { this.cropper?.rotate(degrees); }
  flipHorizontal(): void { this.cropper?.scaleX(-this.cropper.getData().scaleX || -1); }
  flipVertical(): void { this.cropper?.scaleY(-this.cropper.getData().scaleY || -1); }
  reset(): void { this.cropper?.reset(); }

  onSave(): void {
    if (!this.cropper) return;
    const canvas = this.cropper.getCroppedCanvas({
        maxWidth: 2048,
        maxHeight: 2048,
        imageSmoothingQuality: 'high',
    });
    
    if (canvas) {
        // Convert to WebP for optimization
        const dataUrl = canvas.toDataURL('image/webp', 0.9);
        this.save.emit(dataUrl);
    }
  }
}