import { Component, ChangeDetectionStrategy, inject, computed, signal, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AuthService } from './services/auth.service';
import { WebsiteDataService } from './services/website-data.service';
import { EditModeService } from './services/edit-mode.service';
import { LightboxService } from './services/lightbox.service';
import { ToastService } from './services/toast.service';
import { WebsiteData } from './models/website-data.model';

// Components
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { AboutComponent } from './components/about/about.component';
import { FooterComponent } from './components/footer/footer.component';
import { StatsComponent } from './components/stats/stats.component';
import { ToolsComponent } from './components/tools/tools.component';
import { HireMeComponent } from './components/hire-me/hire-me.component';
import { FloatingEditBarComponent } from './components/floating-edit-bar/floating-edit-bar.component';
import { InlineToolbarComponent } from './components/inline-toolbar/inline-toolbar.component';
import { EditableDirective } from './directives/editable.directive';
import { ToastComponent } from './components/toast/toast.component';
import { ImageEditorModalComponent } from './components/image-editor-modal/image-editor-modal.component';
import { LightboxComponent } from './components/lightbox/lightbox.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    HeaderComponent,
    HeroComponent,
    PortfolioComponent,
    AboutComponent,
    FooterComponent,
    StatsComponent,
    ToolsComponent,
    FloatingEditBarComponent,
    InlineToolbarComponent,
    EditableDirective,
    ToastComponent,
    ImageEditorModalComponent,
    LightboxComponent,
    HireMeComponent,
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    // Fix: Move HostListener to host bindings.
    '(window:keydown.control.s)': 'onCtrlS($event)',
  }
})
export class AppComponent {
  authService = inject(AuthService);
  dataService = inject(WebsiteDataService);
  editModeService = inject(EditModeService);
  lightboxService = inject(LightboxService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  
  isLoggedIn = this.authService.isLoggedIn;
  isEditMode = this.editModeService.isEditMode;
  isSaving = this.dataService.isSaving;
  
  lightboxImageUrls = this.lightboxService.imageUrls;
  lightboxStartIndex = this.lightboxService.startIndex;

  // The data displayed on the page. In edit mode, it's the draft. Otherwise, it's the published data.
  displayData = computed(() => {
    if (this.isEditMode() && this.editModeService.draftData()) {
      return this.editModeService.draftData();
    }
    return this.dataService.data();
  });

  isLoading = computed(() => this.displayData() === null);

  constructor() {
    effect(() => {
      if (this.isEditMode()) {
        this.loadDraftData();
      } else {
        // Clear draft data when exiting edit mode
        this.editModeService.draftData.set(null);
        this.editModeService.isDirty.set(false);
      }
    });

    // Auto-save draft on changes
    effect(() => {
        if (this.isEditMode() && this.editModeService.isDirty()) {
            const draft = this.editModeService.draftData();
            if (draft) {
                // This is a throttled autosave, not the manual save button
                this.dataService.savePreviewData(draft);
            }
        }
    });
  }

  onDocumentClick(event: MouseEvent): void {
    const selection = this.editModeService.selection();
    // Only proceed if in edit mode and an element is selected
    if (!this.isEditMode() || !selection) {
      return;
    }

    const target = event.target as Node;
    
    // Check if the click was inside the selected element
    if (selection.element.contains(target)) {
      return;
    }
    
    // Check if the click was inside a toolbar (which handle their own clicks)
    const clickedToolbar = (target as HTMLElement).closest('.inline-toolbar, .floating-edit-bar');
    if (clickedToolbar) {
      return;
    }

    // If the click was outside both, deselect the element
    this.editModeService.selectElement(null);
  }

  onCtrlS(event: KeyboardEvent): void {
    if (this.isEditMode() && this.editModeService.isDirty()) {
      event.preventDefault();
      this.saveDraft();
    }
  }

  private loadDraftData(): void {
    const previewData = this.dataService.loadPreviewData();
    if (previewData) {
      this.editModeService.draftData.set(previewData);
    } else {
      // If no draft exists, create one from the current live data
      const publishedData = this.dataService.data();
      if (publishedData) {
        this.editModeService.draftData.set(JSON.parse(JSON.stringify(publishedData)));
      }
    }
  }

  // --- Edit Bar Actions ---
  saveDraft(): void {
    const draft = this.editModeService.draftData();
    if (draft && this.editModeService.isDirty()) {
      this.dataService.savePreviewData(draft).then(() => {
        this.editModeService.isDirty.set(false);
        this.editModeService.lastSavedAt.set(new Date());
      });
    }
  }

  publish(): void {
    const draft = this.editModeService.draftData();
    if (draft) {
      this.dataService.savePublishedData(draft).then(() => {
        this.editModeService.isDirty.set(false);
        this.editModeService.lastSavedAt.set(null); // No longer just a draft
        this.dataService.discardPreviewData();
        this.toastService.add({
          message: 'Website published successfully!',
          type: 'success',
        });
      });
    }
  }

  discardDraft(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (confirm('Are you sure you want to discard all unpublished changes?')) {
        this.dataService.discardPreviewData();
        this.editModeService.isDirty.set(false);
        this.editModeService.lastSavedAt.set(null);
        // Reload draft from published data to reset the view
        this.loadDraftData();
        this.toastService.add({
          message: 'Unpublished changes have been discarded.',
          type: 'info',
        });
    }
  }

  saveEditedImage(newDataUrl: string): void {
    this.editModeService.saveEditedImage(newDataUrl);
  }
}
