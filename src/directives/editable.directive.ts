import { Directive, ElementRef, OnDestroy, Renderer2, effect, inject, input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EditModeService } from '../services/edit-mode.service';

@Directive({
  selector: '[appEditable]',
  standalone: true,
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    // Change to click event for selection to avoid interfering with button mousedown/click cycle.
    '(click)': 'onClick($event)',
  }
})
export class EditableDirective implements OnDestroy {
  editableType = input.required<'text' | 'hero' | 'portfolio' | 'logo' | 'stat'>();
  editablePath = input.required<string>(); // e.g. 'hero.heading'

  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private editModeService = inject(EditModeService);
  private platformId = inject(PLATFORM_ID);
  
  private isSelected = false;
  private unlistenBlur: (() => void) | null = null;
  private initialContent = '';
  private wasGradient = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Effect to apply/remove editable attributes and classes based on edit mode state
    effect(() => {
      const el = this.elementRef.nativeElement;
      if (this.editModeService.isEditMode()) {
        this.renderer.addClass(el, 'editable-highlight-base'); // A base class for cursor etc.
      } else {
        this.renderer.removeClass(el, 'editable-highlight-base');
        this.renderer.removeClass(el, 'editable-highlight');
        this.renderer.removeClass(el, 'editable-selected');
        this.renderer.setAttribute(el, 'contenteditable', 'false');
      }
    });

    // Effect to handle selection state changes
    effect(() => {
      const selection = this.editModeService.selection();
      const el = this.elementRef.nativeElement;
      this.isSelected = selection?.path === this.editablePath();
      
      if (this.isSelected) {
        this.renderer.addClass(el, 'editable-selected');
        this.enableContentEditable();
      } else {
        this.renderer.removeClass(el, 'editable-selected');
        this.disableContentEditable();
      }
    });
  }

  onMouseEnter(): void {
    if (this.editModeService.isEditMode()) {
      this.renderer.addClass(this.elementRef.nativeElement, 'editable-highlight');
    }
  }

  onMouseLeave(): void {
    this.renderer.removeClass(this.elementRef.nativeElement, 'editable-highlight');
  }

  onClick(event: MouseEvent): void {
    if (!this.editModeService.isEditMode()) return;
    
    const target = event.target as HTMLElement;

    // If the click is inside the UI overlay container, let the UI's own
    // click handlers do their job and don't trigger selection for the editable area.
    if (target.closest('.editable-ui-container')) {
      return;
    }

    // This click is for selecting the editable element.
    this.editModeService.selectElement({
      path: this.editablePath(),
      element: this.elementRef.nativeElement,
      type: this.editableType(),
    });
  }

  private enableContentEditable(): void {
    if (this.editableType() !== 'text' || !isPlatformBrowser(this.platformId)) return;
    
    const el = this.elementRef.nativeElement;
    const style = this.editModeService.getStyleForPath(this.editablePath());
    if (style?.isGradient) {
        this.wasGradient = true;
        this.renderer.removeClass(el, 'text-transparent');
        this.renderer.removeClass(el, 'bg-clip-text');
    }
    
    this.renderer.setAttribute(el, 'contenteditable', 'true');
    this.initialContent = el.innerHTML;
    el.focus();

    // Listen for blur event to save changes
    this.unlistenBlur = this.renderer.listen(el, 'blur', () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        this.editModeService.setLastSelectionRange(selection.getRangeAt(0));
      }
      this.saveContent();
    });
  }

  private disableContentEditable(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const el = this.elementRef.nativeElement;
    if (this.wasGradient) {
        this.renderer.addClass(el, 'text-transparent');
        this.renderer.addClass(el, 'bg-clip-text');
        this.wasGradient = false;
    }

    // Check if contenteditable is true before removing, to avoid unnecessary operations
    if (el.getAttribute('contenteditable') === 'true') {
        this.renderer.setAttribute(el, 'contenteditable', 'false');
        if (this.unlistenBlur) {
            this.unlistenBlur();
            this.unlistenBlur = null;
        }
    }
  }
  
  private saveContent(): void {
    const el = this.elementRef.nativeElement;
    const newContent = el.innerHTML;
    if (newContent !== this.initialContent) {
        // With partial styling, we save the raw HTML content.
        // The browser's contenteditable handles the generation of <b>, <i>, <font>, <span> etc.
        this.editModeService.updateElementContent(this.editablePath(), newContent);
    }
  }
  
  ngOnDestroy(): void {
    if (this.unlistenBlur) {
      this.unlistenBlur();
    }
  }
}
