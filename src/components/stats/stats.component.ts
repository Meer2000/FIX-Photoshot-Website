import { Component, ChangeDetectionStrategy, input, effect, signal, isDevMode, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { StatsData, StatItem } from '../../models/website-data.model';
import { EditableDirective } from '../../directives/editable.directive';
import { EditModeService } from '../../services/edit-mode.service';

interface AnimatedStatItem extends StatItem {
  displayValue: string;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, EditableDirective],
})
export class StatsComponent {
  data = input.required<StatsData>();
  
  animatedItems = signal<AnimatedStatItem[]>([]);
  
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  editModeService = inject(EditModeService);
  isEditMode = this.editModeService.isEditMode;
  isVisible = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.isVisible.set(true);
          observer.unobserve(this.elementRef.nativeElement);
        }
      }, { threshold: 0.2 });
      observer.observe(this.elementRef.nativeElement);
    }

    effect(() => {
      const items = this.data()?.items;
      if (!items) return;

      if (this.isVisible() && !this.isEditMode()) {
        this.animateStats();
      } else {
        // Initialize with final values if not animating
        this.animatedItems.set(items.map(item => {
            const value = parseFloat(item.value.replace(/,/g, ''));
            return {
                ...item,
                displayValue: isNaN(value) ? item.value : value.toLocaleString()
            };
        }));
      }
    });
  }

  private animateStats(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const items = this.data().items;
    this.animatedItems.set(items.map(item => ({ ...item, displayValue: '0' })));

    items.forEach((item, index) => {
      const finalValue = parseFloat(item.value.replace(/,/g, ''));
      if (isNaN(finalValue)) {
        this.animatedItems.update(current => {
          if(current[index]) {
            current[index].displayValue = item.value;
          }
          return [...current];
        });
        return;
      }

      let startValue = 0;
      const duration = 2000;
      let startTime: number | null = null;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentValue = Math.floor(this.easeOutCubic(progress) * finalValue);

        this.animatedItems.update(current => {
          if (current[index]) {
            current[index].displayValue = currentValue.toLocaleString();
          }
          return [...current];
        });

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          this.animatedItems.update(current => {
            if (current[index]) {
              current[index].displayValue = finalValue.toLocaleString();
            }
            return [...current];
          });
        }
      };
      requestAnimationFrame(step);
    });
  }
  
  private easeOutCubic(t: number): number {
    return (--t) * t * t + 1;
  }
}
