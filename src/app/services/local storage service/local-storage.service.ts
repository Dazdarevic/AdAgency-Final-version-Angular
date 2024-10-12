import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  getLocalStorage() {
    return typeof window !== 'undefined' ? localStorage : null;
  }

  getItem(key: string): string | null {
    const storage = this.getLocalStorage();
    return storage ? storage.getItem(key) : null;
  }

  setItem(key: string, value: string): void {
    const storage = this.getLocalStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  }
  removeItem(key: string): void {
    const storage = this.getLocalStorage();
    if (storage) {
      storage.removeItem(key);
    }
  }
}
