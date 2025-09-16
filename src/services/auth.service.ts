
import { Injectable, signal } from '@angular/core';

const AUTH_KEY = 'fixphotoshot_auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn = signal<boolean>(false);

  constructor() {
    const storedAuth = localStorage.getItem(AUTH_KEY);
    if (storedAuth) {
      this.isLoggedIn.set(JSON.parse(storedAuth));
    }
  }

  login(): Promise<void> {
    return new Promise(resolve => {
        setTimeout(() => {
            this.isLoggedIn.set(true);
            localStorage.setItem(AUTH_KEY, JSON.stringify(true));
            resolve();
        }, 500);
    });
  }

  logout(): void {
    this.isLoggedIn.set(false);
    localStorage.removeItem(AUTH_KEY);
  }
}
