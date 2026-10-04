import { GalleryStore, galleryStorageKey } from './gallery.store';
import { defaultSelection } from '../model/kitty.model';

describe('GalleryStore', () => {
  beforeEach(() => localStorage.removeItem(galleryStorageKey));
  afterEach(() => localStorage.removeItem(galleryStorageKey));

  it('restores snapshots from localStorage in newest-first order', () => {
    const firstStore = new GalleryStore();
    firstStore.add('First', defaultSelection);
    firstStore.add('Second', { ...defaultSelection, face: 'sleepy' });

    const restoredStore = new GalleryStore();
    expect(restoredStore.snapshots().map((snapshot) => snapshot.name)).toEqual(['Second', 'First']);
    expect(restoredStore.snapshots()[0].selection.face).toBe('sleepy');
  });

  it('copies the selected values into each snapshot', () => {
    const selection = { ...defaultSelection };
    const store = new GalleryStore();
    store.add('  Miso  ', selection);
    selection.coat = 'ginger';

    expect(store.snapshots()[0].name).toBe('Miso');
    expect(store.snapshots()[0].selection.coat).toBe('cream');
  });

  it('keeps an in-memory gallery when storage is unavailable', () => {
    const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('Storage unavailable');
      },
    });

    try {
      const store = new GalleryStore();
      store.add('Miso', defaultSelection);
      expect(store.persistenceUnavailable()).toBe(true);
      expect(store.snapshots()).toHaveLength(1);
    } finally {
      if (storage) Object.defineProperty(globalThis, 'localStorage', storage);
    }
  });
});
