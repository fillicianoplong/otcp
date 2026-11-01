import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ZoomMode = 'fit' | 'actual';

export type CardImageZoomViewerProps = {
  src: string;
  alt: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/** Tailwind classes that keep fit mode inside the viewport with a small margin. */
export const CARD_IMAGE_VIEWER_FIT_IMAGE_CLASS =
  'mx-auto block max-h-[calc(100vh-4rem)] max-w-[calc(100vw-4rem)] object-contain';

type TouchLike = { clientX: number; clientY: number };

function touchDistance(touches: { length: number; item(index: number): TouchLike | null }): number {
  const a = touches.item(0);
  const b = touches.item(1);
  if (!a || !b) return 0;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function CardImageZoomViewer({ src, alt, onClose, triggerRef }: CardImageZoomViewerProps) {
  const titleId = useId().replace(/:/g, '');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ZoomMode>('fit');
  const [scale, setScale] = useState(1);
  const pinchRef = useRef<{ startDistance: number; startScale: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const handleClose = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();

    const root = dialogRef.current;
    if (!root) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute('disabled') && node.tabIndex !== -1,
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  const toggleMode = () => {
    setMode((current) => {
      if (current === 'fit') {
        setScale(1);
        return 'actual';
      }
      setScale(1);
      return 'fit';
    });
  };

  const onBackdropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const onScrollPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'actual' || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    el.setPointerCapture(event.pointerId);
  };

  const onScrollPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollRef.current;
    if (!drag || !el || drag.pointerId !== event.pointerId) return;
    el.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
    el.scrollTop = drag.scrollTop - (event.clientY - drag.startY);
  };

  const onScrollPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollRef.current;
    if (!drag || !el || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    el.releasePointerCapture(event.pointerId);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (mode !== 'actual' || event.touches.length !== 2) return;
    pinchRef.current = {
      startDistance: touchDistance(event.touches),
      startScale: scale,
    };
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const pinch = pinchRef.current;
    if (!pinch || mode !== 'actual' || event.touches.length !== 2) return;
    event.preventDefault();
    const distance = touchDistance(event.touches);
    if (pinch.startDistance <= 0) return;
    const next = pinch.startScale * (distance / pinch.startDistance);
    setScale(Math.min(4, Math.max(1, next)));
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  const viewer = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex flex-col bg-[rgb(0_0_0/0.88)] text-text"
    >
      <p id={titleId} className="sr-only">
        {`Zoomed artwork for ${alt}`}
      </p>
      <div className="flex shrink-0 justify-end p-3">
        <button
          ref={closeRef}
          type="button"
          onClick={handleClose}
          className="inline-flex min-h-[var(--touch-min)] items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-heading hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          Close
        </button>
      </div>
      <div
        ref={scrollRef}
        className={[
          'relative min-h-0 flex-1 touch-none',
          mode === 'actual'
            ? 'cursor-grab overflow-auto active:cursor-grabbing'
            : 'overflow-hidden',
        ].join(' ')}
        onPointerDownCapture={onScrollPointerDown}
        onPointerMove={onScrollPointerMove}
        onPointerUp={onScrollPointerUp}
        onPointerCancel={onScrollPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          className={
            mode === 'fit'
              ? 'flex h-full min-h-0 w-full items-center justify-center p-4'
              : 'inline-flex min-h-min min-w-min p-4'
          }
          onPointerDown={onBackdropPointerDown}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleMode();
            }}
            className={[
              'border-0 bg-transparent p-0',
              mode === 'actual' ? 'cursor-zoom-out' : 'cursor-zoom-in',
            ].join(' ')}
            aria-label={mode === 'fit' ? 'Show artwork at actual size' : 'Fit artwork to screen'}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className={
                mode === 'fit'
                  ? `${CARD_IMAGE_VIEWER_FIT_IMAGE_CLASS} select-none motion-safe:transition-[max-width,max-height] motion-safe:duration-200`
                  : 'h-auto w-auto max-h-none max-w-none select-none motion-safe:transition-transform motion-safe:duration-200'
              }
              style={
                mode === 'actual'
                  ? { transform: `scale(${scale})`, transformOrigin: 'center center' }
                  : undefined
              }
            />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(viewer, document.body);
}
