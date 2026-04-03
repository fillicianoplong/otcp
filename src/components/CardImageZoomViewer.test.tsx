/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { CARD_IMAGE_VIEWER_FIT_IMAGE_CLASS, CardImageZoomViewer } from './CardImageZoomViewer.tsx';

function ViewerHarness() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);

  return (
    <>
      <button ref={triggerRef} type="button">
        Card artwork
      </button>
      {open ? (
        <CardImageZoomViewer
          src="/otcp/card-images/46986420.jpg"
          alt="Dark Magician"
          onClose={() => setOpen(false)}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('CardImageZoomViewer', () => {
  it('locks page scroll and exposes an accessible dialog label', () => {
    render(<ViewerHarness />);

    expect(document.body.style.overflow).toBe('hidden');
    screen.getByRole('dialog', { name: 'Zoomed artwork for Dark Magician' });
  });

  it('applies the viewport height constraint in fit mode', () => {
    render(<ViewerHarness />);

    const img = screen.getByRole('img', { name: 'Dark Magician' });
    for (const token of CARD_IMAGE_VIEWER_FIT_IMAGE_CLASS.split(/\s+/)) {
      expect(img.className).toContain(token);
    }
  });

  it('closes from the close button and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    const trigger = screen.getByRole('button', { name: 'Card artwork' });
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('closes when clicking the backdrop padding', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    const dialog = screen.getByRole('dialog', { name: 'Zoomed artwork for Dark Magician' });
    const backdrop = dialog.querySelector('.items-center.justify-center.p-4');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('toggles between fit and actual size when clicking the artwork control', async () => {
    const user = userEvent.setup();
    render(<ViewerHarness />);

    const fitControl = screen.getByRole('button', { name: 'Show artwork at actual size' });
    await user.click(fitControl);
    screen.getByRole('button', { name: 'Fit artwork to screen' });

    await user.click(screen.getByRole('button', { name: 'Fit artwork to screen' }));
    screen.getByRole('button', { name: 'Show artwork at actual size' });
  });
});
