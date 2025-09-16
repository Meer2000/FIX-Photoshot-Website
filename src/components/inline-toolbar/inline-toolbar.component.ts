



import { Component, ChangeDetectionStrategy, effect, signal, ElementRef, inject, computed, OnDestroy, PLATFORM_ID } from '@angular/core';
// Fix: Moved `isPlatformBrowser` from `@angular/core` import to `@angular/common` import.
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { EditModeService, Selection } from '../../services/edit-mode.service';
import { ElementStyle } from '../../models/website-data.model';

interface SelectionState {
  isBold: boolean;
  isItalic: boolean;
  color: string;
}

@Component({
  selector: 'app-inline-toolbar',
  templateUrl: './inline-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class InlineToolbarComponent implements OnDestroy {
  editModeService = inject(EditModeService);
  private elementRef = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);

  position = signal({ top: '-9999px', left: '-9999px' });
  selectionState = signal<SelectionState>({ isBold: false, isItalic: false, color: '#000000' });

  selection = computed(() => {
    const sel = this.editModeService.selection();
    if (sel?.type === 'text') {
      return sel;
    }
    return null;
  });

  currentBlockStyle = computed<ElementStyle>(() => {
    const path = this.selection()?.path;
    return path ? this.editModeService.getStyleForPath(path) ?? {} : {};
  });

  currentFontSize = computed<string>(() => {
    return (this.currentBlockStyle().fontSize || '16').replace('px', '');
  });

  isBold = computed(() => this.selectionState().isBold || (this.currentBlockStyle().fontWeight ?? 400) >= 600);
  
  isItalic = computed(() => this.selectionState().isItalic || this.currentBlockStyle().fontStyle === 'italic');

  isGradient = computed(() => this.currentBlockStyle().isGradient === true);
  
  gradientFrom = computed(() => this.currentBlockStyle().gradientFrom || '#3b82f6');
  gradientTo = computed(() => this.currentBlockStyle().gradientTo || '#14b8a6');

  textAlign = computed(() => this.currentBlockStyle().textAlign || 'left');

  currentOpacity = computed<string>(() => {
    return ((this.currentBlockStyle().opacity ?? 1) * 100).toFixed(0);
  });

  currentLetterSpacing = computed<string>(() => {
    return (this.currentBlockStyle().letterSpacing || '0').replace('px', '');
  });

  currentLineHeight = computed<string>(() => {
    return this.currentBlockStyle().lineHeight || '1.5';
  });

  constructor() {
    effect(() => {
      const sel = this.selection();
      if (sel) {
        this.calculatePosition(sel);
        this.updateSelectionState();
      } else {
        this.hide();
      }
    });

    if (isPlatformBrowser(this.platformId)) {
        document.addEventListener('selectionchange', this.onSelectionChange);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('selectionchange', this.onSelectionChange);
    }
  }

  private onSelectionChange = (): void => {
      if (this.selection()) {
          this.updateSelectionState();
      }
  }

  private updateSelectionState(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && this.selection()?.element.contains(selection.anchorNode)) {
        this.selectionState.set({
            isBold: document.queryCommandState('bold'),
            isItalic: document.queryCommandState('italic'),
            color: document.queryCommandValue('foreColor')
        });
    }
  }

  private hide(): void {
    this.position.set({ top: '-9999px', left: '-9999px' });
  }

  private calculatePosition(selection: Selection): void {
    const targetRect = selection.element.getBoundingClientRect();
    const toolbarEl = this.elementRef.nativeElement.firstElementChild as HTMLElement;
    if (!toolbarEl) {
        setTimeout(() => {
            const currentSelection = this.selection();
            if(currentSelection) this.calculatePosition(currentSelection);
        }, 0);
        return;
    }
    const toolbarRect = toolbarEl.getBoundingClientRect();

    let top = targetRect.top - toolbarRect.height - 12;
    let left = targetRect.left + (targetRect.width / 2) - (toolbarRect.width / 2);

    if (top < 10) {
      top = targetRect.bottom + 12;
    }
    if (left + toolbarRect.width > window.innerWidth - 10) {
      left = window.innerWidth - toolbarRect.width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    this.position.set({ top: `${top}px`, left: `${left}px` });
  }
  
  private applyInlineStyle(command: string, value: string | null = null): void {
      const selection = window.getSelection();
      const activeElement = this.selection()?.element;
      
      if (selection && !selection.isCollapsed && activeElement && activeElement.contains(selection.anchorNode)) {
          document.execCommand(command, false, value);
          // After executing a command, we must save the updated HTML back to our state.
          this.editModeService.updateElementContent(this.selection()!.path, activeElement.innerHTML);
          this.updateSelectionState(); // Immediately reflect the change
      }
  }

  updateBlockStyle(style: Partial<ElementStyle>): void {
    const path = this.selection()?.path;
    if (path) {
        this.editModeService.updateElementStyle(path, style);
    }
  }

  toggleBold(event: MouseEvent): void {
    event.preventDefault();
    const selection = window.getSelection();
    const activeElement = this.selection()?.element;
    if (selection && !selection.isCollapsed && activeElement?.contains(selection.anchorNode)) {
      this.applyInlineStyle('bold');
    } else {
      this.updateBlockStyle({ fontWeight: this.isBold() ? 400 : 700 });
    }
  }

  toggleItalic(event: MouseEvent): void {
    event.preventDefault();
    const selection = window.getSelection();
    const activeElement = this.selection()?.element;
     if (selection && !selection.isCollapsed && activeElement?.contains(selection.anchorNode)) {
      this.applyInlineStyle('italic');
    } else {
      this.updateBlockStyle({ fontStyle: this.isItalic() ? 'normal' : 'italic' });
    }
  }

  toggleGradient(event: MouseEvent): void {
    event.preventDefault();
    const isCurrentlyGradient = this.isGradient();
    const styleUpdate: Partial<ElementStyle> = { isGradient: !isCurrentlyGradient };
    
    if (!isCurrentlyGradient) {
        const current = this.currentBlockStyle();
        if (!current.gradientFrom) styleUpdate.gradientFrom = '#3b82f6';
        if (!current.gradientTo) styleUpdate.gradientTo = '#14b8a6';
    }
    this.updateBlockStyle(styleUpdate);
  }

  handleColorChange(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    
    // Restore selection if it exists
    const savedRange = this.editModeService.restoreLastSelectionRange();
    if (savedRange) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(savedRange);
        }
    }

    const selection = window.getSelection();
    const activeElement = this.selection()?.element;
     if (selection && !selection.isCollapsed && activeElement?.contains(selection.anchorNode)) {
        this.applyInlineStyle('foreColor', color);
     } else {
        this.updateBlockStyle({ color });
     }
  }

  handleGradientFromChange(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.updateBlockStyle({ gradientFrom: color });
  }

  handleGradientToChange(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.updateBlockStyle({ gradientTo: color });
  }

  handleFontSizeChange(event: Event): void {
    const size = (event.target as HTMLInputElement).value;
    if (size) {
        const fontSize = `${size}px`;
        this.updateBlockStyle({ fontSize });
    }
  }

  handleTextAlignChange(align: 'left' | 'center' | 'right', event: MouseEvent): void {
    event.preventDefault();
    this.updateBlockStyle({ textAlign: align });
  }

  handleOpacityChange(event: Event): void {
    const opacityValue = parseInt((event.target as HTMLInputElement).value, 10);
    this.updateBlockStyle({ opacity: opacityValue / 100 });
  }

  handleLetterSpacingChange(event: Event): void {
    const spacing = (event.target as HTMLInputElement).value;
    if (spacing || spacing === '0') {
      this.updateBlockStyle({ letterSpacing: `${spacing}px` });
    }
  }

  handleLineHeightChange(event: Event): void {
    const height = (event.target as HTMLInputElement).value;
    if (height) {
      this.updateBlockStyle({ lineHeight: height });
    }
  }
}
