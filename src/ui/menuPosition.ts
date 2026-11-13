export type MenuAlign = 'end' | 'start';
export type MenuPlacement = 'below' | 'above';

export type MenuAnchor = {
  top: number;
  left: number;
  maxHeight: number;
  placement: MenuPlacement;
};

type Rect = { top: number; right: number; bottom: number; left: number };
type Size = { width: number; height: number };

/** Places a menu on the trigger's right edge, one gap below, then keeps it in the viewport. */
export function placeAnchoredMenu(
  trigger: Rect,
  menu: Size,
  viewport: Size,
  gap: number,
  align: MenuAlign = 'end',
): MenuAnchor {
  const spaceBelow = viewport.height - gap - (trigger.bottom + gap);
  const spaceAbove = trigger.top - gap - gap;
  const placement: MenuPlacement =
    menu.height > spaceBelow && spaceAbove > spaceBelow ? 'above' : 'below';
  const maxHeight = Math.max(0, placement === 'above' ? spaceAbove : spaceBelow);
  const height = Math.min(menu.height, maxHeight);
  const top = placement === 'above' ? trigger.top - gap - height : trigger.bottom + gap;

  let left = align === 'end' ? trigger.right - menu.width : trigger.left;
  const maxLeft = viewport.width - gap - menu.width;
  if (left > maxLeft) left = maxLeft;
  if (left < gap) left = gap;

  return { top, left, maxHeight, placement };
}

export function readMenuGap(): number {
  if (typeof document === 'undefined') return 4;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--space-1').trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : 4;
}
