import { Injectable, signal } from '@angular/core';
import { isSnapshot, KittySelection, Snapshot } from '../model/kitty.model';

export const galleryStorageKey = 'kitty-creator:snapshots:v1';

@Injectable({ providedIn: 'root' })
export class GalleryStore {
  readonly snapshots = signal<readonly Snapshot[]>([]);
  readonly persistenceUnavailable = signal(false);

  constructor() {
    this.restore();
  }

  add(name: string, selection: KittySelection): Snapshot {
    const snapshot: Snapshot = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        String(Date.now()) + '-' + Math.random().toString(36).slice(2),
      name: name.trim().slice(0, 24) || 'Мой котик',
      createdAt: Date.now(),
      selection: { ...selection },
    };

    const next = [snapshot, ...this.snapshots()];
    this.snapshots.set(next);

    if (!this.persistenceUnavailable()) {
      try {
        globalThis.localStorage.setItem(galleryStorageKey, JSON.stringify(next));
      } catch {
        this.persistenceUnavailable.set(true);
      }
    }

    return snapshot;
  }

  clear(): void {
    this.snapshots.set([]);
    try {
      globalThis.localStorage.removeItem(galleryStorageKey);
    } catch {
      this.persistenceUnavailable.set(true);
    }
  }

  private restore(): void {
    let raw: string | null;
    try {
      raw = globalThis.localStorage.getItem(galleryStorageKey);
    } catch {
      this.persistenceUnavailable.set(true);
      return;
    }

    if (!raw) return;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.snapshots.set(parsed.filter(isSnapshot));
      }
    } catch {
      this.snapshots.set([]);
    }
  }
}
