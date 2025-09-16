import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WebsiteData, ElementStyle, PortfolioItem, HeroBanner, PortfolioImage, StatsData, AboutData, PortfolioData, HireMeData, EditableListItem } from '../models/website-data.model';
import { ToastService } from './toast.service';

const DB_KEY = 'fixphotoshot_db';
const PREVIEW_DB_KEY = 'fixphotoshot_preview_db';

const DEFAULT_STYLE: ElementStyle = { color: '#1e293b' };

const generatePortfolioImages = (seed: string, count: number): PortfolioImage[] => {
  const images: PortfolioImage[] = [];
  for (let i = 1; i <= count; i++) {
    images.push({
      id: `img-${seed}-${i}`,
      thumbnail: `https://picsum.photos/seed/${seed}${i}/600/400`,
      fullImage: `https://picsum.photos/seed/${seed}${i}/1200/800`,
    });
  }
  return images;
}

const DEFAULT_DATA: WebsiteData = {
    hero: {
      banners: [
        {
          id: `banner-${Date.now()}-1`,
          desktopImage: 'https://picsum.photos/seed/hero-desktop/1920/600',
          mobileImage: 'https://picsum.photos/seed/hero-mobile/800/600',
          aspectRatio: '1920 / 600',
          link: '#portfolio'
        },
        {
          id: `banner-${Date.now()}-2`,
          desktopImage: 'https://picsum.photos/seed/hero-desktop2/1920/600',
          mobileImage: 'https://picsum.photos/seed/hero-mobile2/800/600',
          aspectRatio: '1920 / 600',
          link: '#about'
        },
        {
          id: `banner-${Date.now()}-3`,
          desktopImage: 'https://picsum.photos/seed/hero-desktop3/1920/600',
          mobileImage: 'https://picsum.photos/seed/hero-mobile3/800/600',
          aspectRatio: '1920 / 600',
          link: '#contact'
        }
      ]
    },
    about: {
        enabled: true,
        heading: "About Me",
        headingStyle: { color: '#1e293b', fontWeight: 700 },
        paragraph: "I specialize in transforming standard images into professional-grade visuals. By combining advanced AI tools with expert editing techniques, I enhance every detail to make each image stand out.\n\nFrom e-commerce product shots to lifestyle imagery and creative transformations, every project is crafted with focus, precision, and artistic flair.",
        paragraphStyle: { color: '#475569', lineHeight: '1.75' }, // slate-600
        image: 'https://picsum.photos/seed/about-me/800/800',
        expertiseHeading: 'Editing Expertise:',
        expertiseHeadingStyle: {},
        expertiseItems: [
            { id: 'exp-1', text: 'AI-Powered Retouching: Sharp, consistent, and precise edits', textStyle: {} },
            { id: 'exp-2', text: 'E-commerce & Product Images: Clean, high-impact visuals for online sales', textStyle: {} },
            { id: 'exp-3', text: 'Before & After Transformations: Subtle to dramatic enhancements', textStyle: {} },
            { id: 'exp-4', text: 'Creative Effects & Lighting Adjustments: Shadows, reflections, highlights', textStyle: {} }
        ]
    },
    contact: {
        heading: "Get in Touch",
        headingStyle: DEFAULT_STYLE,
        paragraph: "Have a project in mind? Let's talk. Fill out the form below and I'll get back to you as soon as possible.",
        paragraphStyle: { color: '#475569' }, // slate-600
        formspreeId: "your-form-id-here"
    },
    portfolio: {
        enabled: true,
        heading: "Portfolio",
        headingStyle: { ...DEFAULT_STYLE, fontWeight: 700, color: '#1e293b' },
        items: [
            { id: '1', title: "Jewelry Retouching", titleStyle: {}, images: generatePortfolioImages('port1', 10), order: 0 },
            { id: '2', title: "E-commerce Product Shot", titleStyle: {}, images: generatePortfolioImages('port2', 10), order: 1 },
            { id: '3', title: "Fashion Lookbook Edit", titleStyle: {}, images: generatePortfolioImages('port3', 10), order: 2 },
        ]
    },
    stats: {
        enabled: true,
        sectionHeading: "Proven Experience on",
        sectionHeadingStyle: { color: '#1e293b', fontWeight: 700 },
        mainStatValue: '7',
        mainStatValueStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' },
        mainStatSuffix: '+',
        mainStatSuffixStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' },
        heading: "Years of Professional Photo Editing Experience",
        headingStyle: { color: '#334155' },
        paragraph: "Delivering high-quality retouching and editing for global clients. From e-commerce to luxury brands, every project is handled with precision, creativity, and consistency.",
        paragraphStyle: { color: '#475569' },
        ctaText: 'Hire Me',
        ctaLink: '#contact',
        items: [
            { id: 'stat-1', value: '2000', valueStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' }, label: 'Projects Completed', labelStyle: {}, suffix: '+', suffixStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' } },
            { id: 'stat-2', value: '20000', valueStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' }, label: 'Images Edited', labelStyle: {}, suffix: '+', suffixStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' } },
            { id: 'stat-3', value: '100', valueStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' }, label: 'Client Satisfaction', labelStyle: {}, suffix: '%', suffixStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' } },
            { id: 'stat-4', value: '24', valueStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' }, label: 'Turnaround', labelStyle: {}, suffix: '-Hour', suffixStyle: { isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' } },
        ]
    },
    tools: {
        enabled: true,
        heading: "Tools & AI I Use",
        headingStyle: { ...DEFAULT_STYLE, fontWeight: 700 },
        items: [
            { id: 'tool-1', name: 'Adobe Photoshop', nameStyle: {}, description: 'Photo Editing & Retouching', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/e0e7ff/4338ca?text=Ps' },
            { id: 'tool-2', name: 'Adobe Lightroom', nameStyle: {}, description: 'Color Correction & Color Grading', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/e0e7ff/4338ca?text=Lr' },
            { id: 'tool-3', name: 'Adobe Illustrator', nameStyle: {}, description: 'Design & Vector Graphic Work', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/e0e7ff/4338ca?text=Ai' },
            { id: 'tool-4', name: 'Adobe Premiere Pro', nameStyle: {}, description: 'Video Editing & Color Grading', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/e0e7ff/4338ca?text=Pr' },
            { id: 'tool-5', name: 'Adobe Acrobat', nameStyle: {}, description: 'PDF & Document Management', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/e0e7ff/4338ca?text=Ac' },
            { id: 'tool-6', name: 'ChatGPT', nameStyle: {}, description: 'AI-Assisted Workflow & Prompt Generation', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/dcfce7/15803d?text=AI' },
            { id: 'tool-7', name: 'Google Gemini', nameStyle: {}, description: 'Advanced AI Photo Editing', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/dcfce7/15803d?text=AI' },
            { id: 'tool-8', name: 'Generative Fill', nameStyle: {}, description: 'AI-Assisted To Fixing Photos In Photoshop', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/dcfce7/15803d?text=AI' },
            { id: 'tool-9', name: 'ComfyUI & SDXL', nameStyle: {}, description: ' AI Image Generation & Enhancement', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/dcfce7/15803d?text=AI' },
            { id: 'tool-10', name: 'Blender', nameStyle: {}, description: '3D Modeling & Visual Effects', descriptionStyle: {}, iconSrc: 'https://placehold.co/80x80/e0e7ff/4338ca?text=3D' },
        ]
    },
    hireMe: {
        enabled: true,
        heading: "Hire Me",
        headingStyle: { ...DEFAULT_STYLE, fontWeight: 700 },
        paragraph1: "Step 1) Click the button below to invite me on Upwork. I’ll provide a free sample edit for your first project so you can see the quality and style before committing.",
        paragraph1Style: { color: '#374151' },
        paragraph2: "Step 2) Once you send an invite or hire request, I’ll respond within an hour to discuss your project requirements, turnaround time, and any specific editing style you need.",
        paragraph2Style: { color: '#374151' },
        buttonText: "Invite Me on",
        buttonTextStyle: {},
        buttonLink: "https://www.upwork.com/freelancers/~01a2b3c4d5e6f7g8h9",
        highlightText: "Get Your First Edit Free!",
        highlightTextStyle: { fontWeight: 600, isGradient: true, gradientFrom: '#3b82f6', gradientTo: '#14b8a6' }
    },
    footer: {
        copyrightText: 'FIX PhotoShot. All rights reserved.',
        copyrightTextStyle: { color: '#94a3b8' }
    }
};

@Injectable({
  providedIn: 'root'
})
export class WebsiteDataService {
  private platformId = inject(PLATFORM_ID);
  private toastService = inject(ToastService);
  
  isSaving = signal(false);

  // This signal always holds the LIVE, PUBLISHED data
  data = signal<WebsiteData | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Use setTimeout to ensure this runs after the initial synchronous setup,
      // preventing any potential blocking issues with localStorage during bootstrap.
      setTimeout(() => this.loadPublishedData(), 0);
    } else {
      // For non-browser platforms, set data synchronously.
      this.data.set(DEFAULT_DATA);
    }
  }

  private loadPublishedData(): void {
    try {
      const storedData = localStorage.getItem(DB_KEY);
      let data = storedData ? JSON.parse(storedData) : DEFAULT_DATA;
      data = this.migrateData(data);
      this.data.set(data);
    } catch (e) {
      console.error('Failed to load published data from localStorage', e);
      this.data.set(DEFAULT_DATA);
    }
  }

  loadPreviewData(): WebsiteData | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const storedData = localStorage.getItem(PREVIEW_DB_KEY);
       if (storedData) {
         let data = JSON.parse(storedData);
         return this.migrateData(data);
       }
    } catch (e) {
        console.error('Failed to load preview data', e);
    }
    return null;
  }
  
  private migrateData(data: any): WebsiteData {
    if (!data) return DEFAULT_DATA;

    // Hero Data Migration from old structure to new banner structure
    if (data.hero && !data.hero.banners) {
        console.log('Migrating old hero data...');
        if ((data.hero as any).banner) { // Case: single banner object
            data.hero.banners = [(data.hero as any).banner];
        } else if (Array.isArray((data.hero as any).backgroundImages) && (data.hero as any).backgroundImages.length > 0) { // Case: very old backgroundImages array
            const newBanner: HeroBanner = {
                id: `banner-${Date.now()}`,
                link: '#portfolio',
                desktopImage: (data.hero as any).backgroundImages[0].src
            };
            data.hero.banners = [newBanner];
        } else { // Case: hero object exists but is empty or malformed
            data.hero.banners = DEFAULT_DATA.hero.banners;
        }
        delete (data.hero as any).banner; // clean up old properties
        delete (data.hero as any).backgroundImages;
    }

    // Ensure all banners have a link
    if (data.hero && data.hero.banners) {
        data.hero.banners.forEach((banner: HeroBanner) => {
            if (!banner.link) {
                banner.link = '#portfolio';
            }
        });
    }

    if (data.portfolio) {
        // Migration from array to object structure for portfolio
        if (Array.isArray(data.portfolio)) {
            console.log('Migrating old portfolio array to object structure...');
            data.portfolio = {
                heading: 'Portfolio',
                headingStyle: { ...DEFAULT_STYLE, fontWeight: 700, color: '#1e293b' },
                items: data.portfolio
            };
        }

        // Portfolio data migration from single image to multi-image gallery
        if (data.portfolio.items && data.portfolio.items.length > 0) {
          data.portfolio.items.forEach((item: any) => {
            if (!item.images) { // If `images` array doesn't exist, it's an old item
              const newImage: PortfolioImage = {
                id: `img-${item.id}-migrated`,
                thumbnail: item.thumbnail || item.image || 'https://iili.io/J151Sps.png',
                fullImage: item.fullImage || item.image || 'https://iili.io/J151Sps.png'
              };
              item.images = [newImage];

              // Clean up old properties
              delete item.thumbnail;
              delete item.fullImage;
              delete item.image;
            }
            if (!item.titleStyle) item.titleStyle = {};
          });
        }
    }


    // Add missing top-level sections
    if (!data.about) data.about = DEFAULT_DATA.about;
    if (!data.stats) data.stats = DEFAULT_DATA.stats;
    if (!data.tools) data.tools = DEFAULT_DATA.tools;
    if (!data.hireMe) data.hireMe = DEFAULT_DATA.hireMe;
    if (!data.footer) data.footer = DEFAULT_DATA.footer;
    if ((data as any).logos) delete (data as any).logos; // Remove old logos section
    if (data.contact && typeof data.contact.formspreeId === 'undefined') data.contact.formspreeId = DEFAULT_DATA.contact.formspreeId;

    // Add enabled properties
    if (data.about && typeof data.about.enabled === 'undefined') data.about.enabled = true;
    if (data.portfolio && typeof data.portfolio.enabled === 'undefined') data.portfolio.enabled = true;
    if (data.hireMe && typeof data.hireMe.enabled === 'undefined') data.hireMe.enabled = true;

    // Add Style Objects
    if (data.about && !data.about.headingStyle) data.about.headingStyle = DEFAULT_STYLE;
    if (data.about && !data.about.paragraphStyle) data.about.paragraphStyle = { color: '#475569' };
    if (data.about && !data.about.expertiseHeadingStyle) data.about.expertiseHeadingStyle = {};
    if (data.contact && !data.contact.headingStyle) data.contact.headingStyle = DEFAULT_STYLE;
    if (data.contact && !data.contact.paragraphStyle) data.contact.paragraphStyle = { color: '#475569' };
    if (data.stats && !data.stats.headingStyle) data.stats.headingStyle = DEFAULT_DATA.stats.headingStyle;
    if (data.stats && !data.stats.sectionHeadingStyle) data.stats.sectionHeadingStyle = DEFAULT_DATA.stats.sectionHeadingStyle;
    if (data.stats && !data.stats.mainStatValueStyle) data.stats.mainStatValueStyle = {};
    if (data.stats && !data.stats.mainStatSuffixStyle) data.stats.mainStatSuffixStyle = {};
    if (data.stats && data.stats.items) {
      data.stats.items.forEach((item: any) => {
        if (!item.valueStyle) item.valueStyle = {};
        if (!item.labelStyle) item.labelStyle = {};
        if (!item.suffixStyle) item.suffixStyle = {};
      });
    }
    if (data.tools && !data.tools.headingStyle) data.tools.headingStyle = DEFAULT_DATA.tools.headingStyle;
    if (data.tools && data.tools.items) {
      data.tools.items.forEach((item: any) => {
        if (!item.nameStyle) item.nameStyle = {};
        if (!item.descriptionStyle) item.descriptionStyle = {};
      });
    }
    if (data.portfolio && !data.portfolio.headingStyle) data.portfolio.headingStyle = DEFAULT_DATA.portfolio.headingStyle;
    if (data.hireMe && !data.hireMe.headingStyle) data.hireMe.headingStyle = DEFAULT_DATA.hireMe.headingStyle;
    if (data.hireMe && !data.hireMe.paragraph1Style) data.hireMe.paragraph1Style = { color: '#374151' };
    if (data.hireMe && !data.hireMe.paragraph2Style) data.hireMe.paragraph2Style = { color: '#374151' };
    if (data.hireMe && !data.hireMe.buttonTextStyle) data.hireMe.buttonTextStyle = {};
    if (data.hireMe && !data.hireMe.highlightTextStyle) data.hireMe.highlightTextStyle = { fontWeight: 600 };
    if (data.footer && !data.footer.copyrightTextStyle) data.footer.copyrightTextStyle = { color: '#94a3b8' };
    
    // Migrate About section to new design
    if (data.about && typeof (data.about as AboutData).expertiseHeading === 'undefined') {
        data.about.image = DEFAULT_DATA.about.image;
        data.about.expertiseHeading = DEFAULT_DATA.about.expertiseHeading;
        data.about.expertiseItems = DEFAULT_DATA.about.expertiseItems;
        data.about.paragraph = DEFAULT_DATA.about.paragraph;
        data.about.headingStyle = DEFAULT_DATA.about.headingStyle;
        data.about.paragraphStyle = DEFAULT_DATA.about.paragraphStyle;
    }
    
    // Migrate about.expertiseItems from string[] to object[]
    if (data.about && data.about.expertiseItems && data.about.expertiseItems.length > 0 && typeof data.about.expertiseItems[0] === 'string') {
        console.log('Migrating about.expertiseItems from string[] to object[]');
        data.about.expertiseItems = data.about.expertiseItems.map((itemText: string, index: number) => ({
            id: `exp-${index}-${Date.now()}`,
            text: itemText,
            textStyle: {}
        }));
    }


    // Migrate Stats section to new design
    if (data.stats && typeof (data.stats as StatsData).mainStatValue === 'undefined') {
        data.stats.mainStatValue = DEFAULT_DATA.stats.mainStatValue;
        data.stats.mainStatSuffix = DEFAULT_DATA.stats.mainStatSuffix;
        data.stats.paragraph = DEFAULT_DATA.stats.paragraph;
        data.stats.paragraphStyle = DEFAULT_DATA.stats.paragraphStyle;
        data.stats.ctaText = DEFAULT_DATA.stats.ctaText;
        data.stats.ctaLink = DEFAULT_DATA.stats.ctaLink;
        data.stats.items = DEFAULT_DATA.stats.items;
        data.stats.heading = DEFAULT_DATA.stats.heading; // Update heading text
    }

    // Add sectionHeading to stats
    if (data.stats && typeof (data.stats as StatsData).sectionHeading === 'undefined') {
        data.stats.sectionHeading = DEFAULT_DATA.stats.sectionHeading;
    }


    return data;
  }

  savePublishedData(data: WebsiteData): Promise<void> {
    return this.saveToLocalStorage(DB_KEY, data).then(() => {
        this.data.set(data); // Update the main signal with the new published data
    });
  }

  savePreviewData(data: WebsiteData): Promise<void> {
      return this.saveToLocalStorage(PREVIEW_DB_KEY, data);
  }

  discardPreviewData(): void {
    if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem(PREVIEW_DB_KEY);
    }
  }

  private saveToLocalStorage(key: string, data: WebsiteData): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isSaving.set(true);
      setTimeout(() => {
        try {
          if (data) {
            // Create a deep copy to avoid mutating the live signal data.
            const dataToStore = JSON.parse(JSON.stringify(data));

            // Strip large, non-essential base64 'originalSrc' properties to prevent exceeding localStorage quota.
            // The 'src' property is sufficient for both display and re-editing.
            if (dataToStore.portfolio && dataToStore.portfolio.items) {
                dataToStore.portfolio.items.forEach((item: PortfolioItem) => {
                    delete (item as any).originalSrc;
                });
            }

            localStorage.setItem(key, JSON.stringify(dataToStore));
            window.dispatchEvent(new CustomEvent('mock-db-updated'));
          }
          this.isSaving.set(false);
          resolve();
        } catch (e: any) {
          console.error(`Failed to save data to ${key}`, e);
          if (e.name === 'QuotaExceededError' || (e.message && e.message.includes('quota'))) {
              this.toastService.add({
                  message: 'Could not save. Storage limit reached. Try removing large images.',
                  type: 'error',
                  duration: 8000
              });
          } else {
             this.toastService.add({ message: 'An unknown error occurred while saving.', type: 'error' });
          }
          this.isSaving.set(false);
          reject(e);
        }
      }, 500); // Shorter delay for autosave
    });
  }
}
