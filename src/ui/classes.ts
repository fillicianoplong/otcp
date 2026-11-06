/** Shared class strings. Pixel values come from the tokens in `src/styles/tokens.css`. */

export const focusRingClass =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong';

export const focusRingInsetClass =
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-strong';

export const toolbarButtonClass = `inline-flex h-control shrink-0 items-center justify-center gap-1 rounded-md border border-border bg-surface px-control-x text-sm font-medium text-heading hover:border-border-strong ${focusRingClass}`;

export const toolbarToggleButtonClass = `h-control w-control shrink-0 items-center justify-center border border-border bg-surface text-sm text-text-2 hover:border-border-strong hover:text-heading focus-visible:z-[1] ${focusRingClass} disabled:cursor-not-allowed disabled:opacity-50`;

export const toolbarGroupClass = 'inline-flex shrink-0 items-center rounded-md';

export const chipClass = `inline-flex h-control max-w-full items-center gap-1 rounded-full border border-border bg-surface-2 px-control-x text-sm text-text hover:border-border-strong ${focusRingClass}`;

export const clearChipClass = `inline-flex h-control shrink-0 items-center rounded-md px-1 text-sm text-text underline decoration-border underline-offset-2 hover:text-heading hover:decoration-border-strong ${focusRingClass}`;

const buttonDisabledClass = 'disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButtonClass = `inline-flex min-h-touch items-center justify-center rounded-md border border-border-strong bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90 ${focusRingClass} ${buttonDisabledClass}`;

export const secondaryButtonClass = `inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-heading hover:border-border-strong ${focusRingClass} ${buttonDisabledClass}`;

export const dangerButtonClass = `inline-flex min-h-touch items-center justify-center rounded-md border border-ban-forbidden bg-surface px-4 text-sm font-medium text-ban-forbidden hover:opacity-90 ${focusRingClass} ${buttonDisabledClass}`;

export const ghostButtonClass = `inline-flex min-h-touch items-center justify-center rounded-md border border-transparent bg-transparent px-4 text-sm font-medium text-heading hover:bg-surface-2 ${focusRingClass} ${buttonDisabledClass}`;

export const iconButtonClass = `inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-border bg-surface text-base text-heading hover:border-border-strong ${focusRingClass} disabled:cursor-not-allowed disabled:opacity-40`;

export const quietIconButtonClass = `inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-heading hover:bg-surface-2 ${focusRingClass}`;

export const inputClass = `min-h-touch w-full rounded-md border border-border bg-surface px-3 text-base text-text placeholder:text-text-2 ${focusRingClass}`;

export const inputInsetClass = `min-h-touch w-full rounded-md border border-border bg-bg px-3 text-sm text-heading placeholder:text-text-2 ${focusRingClass}`;

export const inputCompactClass = `h-control min-h-control w-full min-w-0 rounded-md border border-border bg-surface px-2 py-0 text-sm text-text placeholder:text-text-2 ${focusRingClass}`;

export const comboboxFieldClass = `flex min-h-touch min-w-0 max-w-full items-center rounded-md border border-border bg-surface hover:border-border-strong focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-strong`;

export const comboboxInputClass =
  'min-w-0 flex-1 bg-transparent px-3 text-sm font-normal text-heading outline-none placeholder:font-normal placeholder:text-text-2';

export const comboboxListClass =
  'absolute top-full right-0 left-0 z-20 mt-1 max-h-60 w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border border-border bg-surface py-1 shadow-lg';

export const menuPanelClass =
  'absolute z-20 mt-1 min-w-[12rem] rounded-md border border-border bg-surface py-1 shadow-sm';

export const menuItemClass = `flex min-h-touch w-full items-center px-3 text-left text-sm font-medium text-heading hover:bg-surface-2 ${focusRingInsetClass} disabled:cursor-not-allowed disabled:opacity-50`;

export const cardTileLinkClass = `block rounded-sm transition-transform hover:-translate-y-0.5 ${focusRingClass}`;

export const cardTileFrameClass = 'relative w-full overflow-hidden leading-none';

export const thumbClass = 'relative w-thumb shrink-0 overflow-hidden rounded-sm bg-surface-2';

export const listRowLinkClass = `grid grid-cols-[var(--tile-thumb)_minmax(0,1fr)] items-start gap-x-3 rounded-md border border-border bg-surface px-2 py-2 transition-colors hover:border-border-strong md:grid-cols-[var(--tile-thumb)_minmax(10rem,1.6fr)_minmax(9rem,1.2fr)_5.75rem_minmax(8.5rem,1fr)_var(--tile-thumb)] md:items-center ${focusRingClass}`;

export const linkedRowClass =
  'flex min-w-0 items-center justify-between gap-3 px-3 py-1.5 no-underline transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-strong';

export const editorRowClass =
  'flex items-center gap-2 rounded-md border border-border bg-bg px-2 py-1';

export const pageTitleClass = 'text-2xl font-semibold text-heading';

export const sectionTitleClass = 'text-lg font-semibold text-heading';

export const groupTitleClass = 'text-base font-semibold text-heading';

export const selectControlClass = `h-control rounded-md border border-border bg-surface px-control-x text-xs text-heading ${focusRingClass}`;
