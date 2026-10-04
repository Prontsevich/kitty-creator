export const kittySpriteUrl = 'assets/kitty-creator/kitty-parts.svg?v=2';

export const coats = [
  { id: 'cream', label: 'Кремовый' },
  { id: 'ginger', label: 'Рыжий' },
  { id: 'tuxedo', label: 'Смокинг' },
  { id: 'calico', label: 'Трёхцветный' },
] as const;

export const faces = [
  { id: 'happy', label: 'Радостный' },
  { id: 'sleepy', label: 'Сонный' },
  { id: 'curious', label: 'Любопытный' },
] as const;

export const accessories = [
  { id: null, label: 'Без аксессуара' },
  { id: 'scarf', label: 'Платок' },
  { id: 'bow', label: 'Бантик' },
  { id: 'glasses', label: 'Очки' },
] as const;

export const backgrounds = [
  { id: 'butter', label: 'Солнечный' },
  { id: 'sky', label: 'Небо' },
  { id: 'garden', label: 'Сад' },
  { id: 'sunset', label: 'Закат' },
] as const;

export type CoatId = (typeof coats)[number]['id'];
export type FaceId = (typeof faces)[number]['id'];
export type AccessoryId = (typeof accessories)[number]['id'];
export type BackgroundId = (typeof backgrounds)[number]['id'];

export interface KittySelection {
  coat: CoatId;
  face: FaceId;
  accessory: AccessoryId;
  background: BackgroundId;
}

export interface Snapshot {
  id: string;
  name: string;
  createdAt: number;
  selection: KittySelection;
}

export const defaultSelection: KittySelection = {
  coat: 'cream',
  face: 'happy',
  accessory: 'scarf',
  background: 'butter',
};

export function isKittySelection(value: unknown): value is KittySelection {
  if (typeof value !== 'object' || value === null) return false;

  const selection = value as Partial<KittySelection>;
  return (
    coats.some((option) => option.id === selection.coat) &&
    faces.some((option) => option.id === selection.face) &&
    accessories.some((option) => option.id === selection.accessory) &&
    backgrounds.some((option) => option.id === selection.background)
  );
}

export function isSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false;

  const snapshot = value as Partial<Snapshot>;
  return (
    typeof snapshot.id === 'string' &&
    typeof snapshot.name === 'string' &&
    snapshot.name.length > 0 &&
    typeof snapshot.createdAt === 'number' &&
    Number.isFinite(snapshot.createdAt) &&
    isKittySelection(snapshot.selection)
  );
}
