import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LightboxService {
  imageUrls = signal<string[] | null>(null);
  startIndex = signal<number>(0);

  open(urls: string[], start: number = 0): void {
    if (urls && urls.length > 0) {
      this.imageUrls.set(urls);
      this.startIndex.set(start);
    }
  }

  close(): void {
    this.imageUrls.set(null);
  }
}
