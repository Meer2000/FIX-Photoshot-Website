import { Component, ChangeDetectionStrategy, input, output, signal, OnChanges, SimpleChanges, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'handleKeyDown($event)',
  },
})
export class LightboxComponent implements OnChanges {
  imageUrls = input.required<string[]>();
  startIndex = input<number>(0);
  close = output<void>();
  
  currentIndex = signal(0);
  isLoaded = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startIndex']) {
      this.currentIndex.set(this.startIndex());
    }
  }
  
  next(): void {
    this.isLoaded.set(false);
    this.currentIndex.update(i => (i + 1) % this.imageUrls().length);
  }

  previous(): void {
    this.isLoaded.set(false);
    this.currentIndex.update(i => (i - 1 + this.imageUrls().length) % this.imageUrls().length);
  }
  
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    } else if (event.key === 'ArrowRight') {
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.previous();
    }
  }
}
