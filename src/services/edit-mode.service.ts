import { Injectable, signal, effect, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { WebsiteData, ElementStyle, HeroBanner, PortfolioItem, PortfolioImage, ToolItem, EditableListItem } from '../models/website-data.model';
import { set, get } from 'lodash-es';
import { ToastService } from './toast.service';
import { ImageProcessingService } from './image-processing.service';

export interface Selection {
  path: string; // lodash-style path e.g., 'hero.heading' or 'portfolio.1.title'
  element: HTMLElement;
  type: 'text' | 'hero' | 'portfolio' | 'logo' | 'stat';
}

export interface EditingImage {
  data: string;
  type: 'desktop' | 'mobile' | 'about-profile' | 'tool-icon';
  index: number; // For hero banners
  id?: string; // For tools
}

@Injectable({
  providedIn: 'root',
})
export class EditModeService {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private imageProcessingService = inject(ImageProcessingService);

  // --- State Signals ---
  isEditMode = signal(false);
  selection = signal<Selection | null>(null);
  isDirty = signal(false);
  lastSavedAt = signal<Date | null>(null);
  
  // The master copy of data being edited
  draftData = signal<WebsiteData | null>(null);

  // State for hero banner editing
  currentBannerEditView = signal<'desktop' | 'mobile'>('desktop');

  // State for image editor modal
  editingImage = signal<EditingImage | null>(null);
  
  // State for preserving text selection
  private lastSelectionRange: Range | null = null;

  constructor() {
    // Automatically enter edit mode if the user is already logged in
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.isEditMode.set(true);
      } else {
        this.isEditMode.set(false);
        this.selection.set(null); // Clear selection on logout
      }
    }, { allowSignalWrites: true });
  }
  
  // --- Actions ---
  toggleEditMode(): void {
    this.isEditMode.update(v => !v);
  }
  
  selectElement(selection: Selection | null): void {
    // When deselecting, clear any saved text range
    if (!selection) {
      this.lastSelectionRange = null;
    }
    this.selection.set(selection);
  }

  setBannerEditView(view: 'desktop' | 'mobile'): void {
    this.currentBannerEditView.set(view);
  }

  // --- Text Selection Preservation ---
  setLastSelectionRange(range: Range): void {
    // Only save if it's a non-collapsed selection
    if (!range.collapsed) {
        this.lastSelectionRange = range;
    }
  }

  restoreLastSelectionRange(): Range | null {
      const range = this.lastSelectionRange;
      this.lastSelectionRange = null; // Consume the saved range
      return range;
  }

  // --- Image Editor Actions ---
  openImageEditor(data: string, type: EditingImage['type'], index: number = 0, id?: string): void {
    this.editingImage.set({ data, type, index, id });
  }

  closeImageEditor(): void {
    this.editingImage.set(null);
  }

  saveEditedImage(newDataUrl: string): void {
    const editing = this.editingImage();
    if (!editing) return;

    if (editing.type === 'desktop' || editing.type === 'mobile') {
        const update: Partial<HeroBanner> = {};
        if (editing.type === 'desktop') {
          update.desktopImage = newDataUrl;
        } else {
          update.mobileImage = newDataUrl;
        }
        // Also update aspect ratio based on the new crop
        const img = new Image();
        img.onload = () => {
            update.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
            this.updateHeroBannerAtIndex(editing.index, update);
            this.closeImageEditor();
        };
        img.src = newDataUrl;
    } else if (editing.type === 'about-profile') {
        this.updateAboutImage(newDataUrl);
        this.closeImageEditor();
    }
  }

  // --- Data Manipulation ---
  updateElementContent(path: string, content: any): void {
    this.draftData.update(data => {
      if (!data) return null;
      // Use lodash.set for safely updating nested properties
      const newData = JSON.parse(JSON.stringify(data));
      set(newData, path, content);
      this.isDirty.set(true);
      return newData;
    });
  }

  updateElementStyle(path: string, style: Partial<ElementStyle>): void {
      this.draftData.update(data => {
          if (!data) return null;
          const newData = JSON.parse(JSON.stringify(data));
          
          // The path for a text element is like 'hero.heading', style is 'hero.headingStyle'
          const stylePath = path.endsWith('Style') ? path : path + 'Style';
          
          const currentStyle = get(newData, stylePath, {});
          set(newData, stylePath, { ...currentStyle, ...style });
          
          this.isDirty.set(true);
          return newData;
      });
  }

  getStyleForPath(path: string): ElementStyle | undefined {
    const data = this.draftData();
    if (!data) return undefined;
    const stylePath = path.endsWith('Style') ? path : path + 'Style';
    return get(data, stylePath);
  }

  // --- Hero Banner Specific Methods ---
  updateHeroBannerAtIndex(index: number, props: Partial<HeroBanner>): void {
      this.draftData.update(data => {
          if (!data?.hero?.banners?.[index]) return data;
          const newData = JSON.parse(JSON.stringify(data));
          
          newData.hero.banners[index] = { ...newData.hero.banners[index], ...props };

          this.isDirty.set(true);
          return newData;
      });
  }
  
  addHeroBanner(): void {
    this.draftData.update(data => {
        if (!data?.hero) return data;
        const newData = JSON.parse(JSON.stringify(data));
        
        if (!newData.hero.banners) newData.hero.banners = [];

        const newBanner: HeroBanner = {
            id: `banner-${Date.now()}`,
            link: '#portfolio',
            aspectRatio: '1920 / 600', // Default aspect ratio
        };
        newData.hero.banners.push(newBanner);

        this.isDirty.set(true);
        this.toastService.add({ message: 'New banner slide added.', type: 'success' });
        return newData;
    });
  }

  removeHeroBannerAtIndex(index: number): void {
    this.draftData.update(data => {
        if (!data?.hero?.banners?.[index]) return data;
        const newData = JSON.parse(JSON.stringify(data));
        
        if (newData.hero.banners.length <= 1) {
            this.toastService.add({ message: 'Cannot remove the last banner.', type: 'info' });
            return newData;
        }

        newData.hero.banners.splice(index, 1);
        this.isDirty.set(true);
        this.toastService.add({ message: 'Banner slide removed.', type: 'success' });
        return newData;
    });
  }

  // --- Portfolio Specific Methods ---

  addPortfolioItem(): void {
    this.draftData.update(data => {
      if (!data) return null;
      const newData = JSON.parse(JSON.stringify(data));
      const newOrder = newData.portfolio.items.length > 0 ? Math.max(...newData.portfolio.items.map((p: PortfolioItem) => p.order)) + 1 : 0;
      const newItem: PortfolioItem = {
        id: `port-${Date.now()}`,
        title: 'New Project',
        titleStyle: {},
        images: [{ 
          id: `img-${Date.now()}`,
          thumbnail: 'https://iili.io/J151Sps.png', // Placeholder
          fullImage: 'https://iili.io/J151Sps.png', // Placeholder
        }],
        order: newOrder,
      };
      newData.portfolio.items.push(newItem);
      this.isDirty.set(true);
      this.toastService.add({ message: 'New portfolio item added.', type: 'success' });
      return newData;
    });
  }

  removePortfolioItem(id: string): void {
    this.draftData.update(data => {
      if (!data) return null;
      const newData = JSON.parse(JSON.stringify(data));
      newData.portfolio.items = newData.portfolio.items.filter((item: PortfolioItem) => item.id !== id);
      this.isDirty.set(true);
      this.toastService.add({ message: 'Portfolio item removed.', type: 'success' });
      return newData;
    });
  }

  async updatePortfolioItemImages(id: string, files: FileList): Promise<void> {
    if (files.length === 0) return;
    try {
      this.toastService.add({ message: `Processing ${files.length} image(s)...`, type: 'info', duration: 8000 });
      
      const processingPromises = Array.from(files).map(async (file, index) => {
        const [thumbnail, fullImage] = await Promise.all([
          this.imageProcessingService.convertImageToWebp(file, 600, 0.85), // Thumbnail size
          this.imageProcessingService.convertImageToWebp(file, 1920, 0.9)  // Full image size
        ]);
        return {
          id: `img-${id}-${Date.now()}-${index}`,
          thumbnail,
          fullImage
        };
      });

      const newImages = await Promise.all(processingPromises);

      this.draftData.update(data => {
        if (!data) return null;
        const newData = JSON.parse(JSON.stringify(data));
        const item = newData.portfolio.items.find((p: PortfolioItem) => p.id === id);
        if (item) {
          item.images = newImages;
        }
        this.isDirty.set(true);
        this.toastService.add({ message: 'Image gallery updated successfully.', type: 'success' });
        return newData;
      });
    } catch (error) {
      console.error('Failed to process portfolio images:', error);
      this.toastService.add({ message: 'Failed to update images.', type: 'error' });
    }
  }

  reorderPortfolio(items: PortfolioItem[]): void {
    this.draftData.update(data => {
        if (!data) return null;
        const newData = JSON.parse(JSON.stringify(data));
        newData.portfolio.items = items;
        this.isDirty.set(true);
        // Don't show toast on reorder as it's frequent
        return newData;
    });
  }

  // --- About Section Methods ---
  updateAboutImage(dataUrl: string): void {
    this.draftData.update(data => {
      if (!data) return null;
      const newData = JSON.parse(JSON.stringify(data));
      newData.about.image = dataUrl;
      this.isDirty.set(true);
      return newData;
    });
  }

  addAboutExpertiseItem(): void {
      this.draftData.update(data => {
        if (!data?.about?.expertiseItems) return data;
        const newData = JSON.parse(JSON.stringify(data));
        const newItem: EditableListItem = {
          id: `exp-${Date.now()}`,
          text: 'New expertise item',
          textStyle: {}
        };
        newData.about.expertiseItems.push(newItem);
        this.isDirty.set(true);
        this.toastService.add({ message: 'Expertise item added.', type: 'success' });
        return newData;
      });
  }
  removeAboutExpertiseItem(index: number): void {
      this.draftData.update(data => {
        if (!data?.about?.expertiseItems?.[index]) return data;
        const newData = JSON.parse(JSON.stringify(data));
        newData.about.expertiseItems.splice(index, 1);
        this.isDirty.set(true);
        this.toastService.add({ message: 'Expertise item removed.', type: 'success' });
        return newData;
      });
  }

  // --- Tools Section Methods ---
  addToolItem(): void {
    this.draftData.update(data => {
      if (!data?.tools?.items) return data;
      const newData = JSON.parse(JSON.stringify(data));
      const newItem: ToolItem = {
        id: `tool-${Date.now()}`,
        name: 'New Tool',
        nameStyle: {},
        description: 'Tool description',
        descriptionStyle: {},
        iconSrc: 'https://placehold.co/80x80/e2e8f0/475569?text=Icon'
      };
      newData.tools.items.push(newItem);
      this.isDirty.set(true);
      this.toastService.add({ message: 'New tool added.', type: 'success' });
      return newData;
    });
  }

  removeToolItem(id: string): void {
      this.draftData.update(data => {
        if (!data?.tools?.items) return data;
        const newData = JSON.parse(JSON.stringify(data));
        newData.tools.items = newData.tools.items.filter((item: ToolItem) => item.id !== id);
        this.isDirty.set(true);
        this.toastService.add({ message: 'Tool removed.', type: 'success' });
        return newData;
      });
  }
}
