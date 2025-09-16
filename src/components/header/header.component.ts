import { Component, ChangeDetectionStrategy, input, output, signal, effect, PLATFORM_ID, inject, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  host: {
    'class': 'block transition-all duration-300 ease-in-out',
    '[class.h-20]': '!isScrolled()',
    '[class.h-14]': 'isScrolled()',
  }
})
export class HeaderComponent implements AfterViewInit {
  isLoggedIn = input.required<boolean>();
  isAdminView = input.required<boolean>(); // Kept for layout, but behavior changes
  isEditMode = input.required<boolean>();
  
  login = output<void>();
  logout = output<void>();
  enterAdmin = output<void>(); // This will now toggle Edit Mode
  exitAdmin = output<void>();

  isScrolled = signal(false);
  isDropdownOpen = signal(false);
  isMobileMenuOpen = signal(false);
  activeSection = signal<string>('home');

  private readonly platformId = inject(PLATFORM_ID);
  private sections: HTMLElement[] = [];
  private headerHeight = signal(80); // Corresponds to h-20

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect((onCleanup) => {
        const handleScroll = () => {
          const scrollY = window.scrollY;
          this.isScrolled.set(scrollY > 50);
          this.updateActiveSection(scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        onCleanup(() => {
          window.removeEventListener('scroll', handleScroll);
        });
      });

      effect(() => {
        this.headerHeight.set(this.isScrolled() ? 56 : 80); // h-14 : h-20 in pixels
      });

      // Prevent body scroll when mobile menu is open
      effect(() => {
        if (this.isMobileMenuOpen()) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Query for sections after the view is initialized to ensure they are in the DOM
      this.sections = Array.from(document.querySelectorAll('section[id]'));
      this.updateActiveSection(window.scrollY); // Initial check
    }
  }
  
  private updateActiveSection(scrollY: number): void {
    if (this.isAdminView() || this.isEditMode() || this.sections.length === 0) {
        this.activeSection.set('');
        return;
    }

    // A higher offset to ensure the section is well in view
    const scrollPosition = scrollY + this.headerHeight() + 150; 
    let currentSectionId = 'home';
    
    for (const section of this.sections) {
      if (section.offsetTop <= scrollPosition) {
        currentSectionId = section.id;
      }
    }
    
    // Override for the very top of the page
    if (scrollY < 300) {
      currentSectionId = 'home';
    }

    // Check for bottom of page as a final override
    if ((window.innerHeight + scrollY) >= document.body.offsetHeight - 50) {
      const lastSection = this.sections[this.sections.length - 1];
      if (lastSection) {
        currentSectionId = lastSection.id;
      }
    }
    
    this.activeSection.set(currentSectionId);
  }
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  handleNavClick(event: Event, targetId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    event.preventDefault();
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        // Calculate the correct scroll position considering the fixed header
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = targetPosition - this.headerHeight();

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
    
    // Close mobile menu after clicking a link
    if (this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }
  
  onEnterAdmin(): void {
    this.enterAdmin.emit();
    if (this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  onLogout(): void {
    this.logout.emit();
    if (this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }
}
