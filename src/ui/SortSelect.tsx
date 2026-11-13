export type SortSelectOption<T extends string> = {
  value: T;
  label: string;
};

/**
 * Toolbar sort control. The closed label reads "Sort: Name".
 * An optional direction button sits in the same h-control when the sort has a direction.
 */
export function SortSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  direction,
  onDirectionChange,
}: {
  id?: string;
  label: string;
  value: T;
  options: readonly SortSelectOption<T>[];
  onChange: (value: T) => void;
  direction?: 'asc' | 'desc';
  onDirectionChange?: (direction: 'asc' | 'desc') => void;
}) {
  return (
    <div className="inline-flex h-control items-center rounded-md border border-border bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-strong">
      <span className="pl-2 text-sm text-text-2" aria-hidden="true">
        Sort:
      </span>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={`h-control bg-transparent py-0 pr-1 pl-1 text-sm text-heading outline-none${
          direction && onDirectionChange ? ' w-24' : ''
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {direction && onDirectionChange ? (
        <button
          type="button"
          aria-label={direction === 'asc' ? 'Ascending' : 'Descending'}
          onClick={() => onDirectionChange(direction === 'asc' ? 'desc' : 'asc')}
          className="h-full w-7 shrink-0 text-sm text-heading"
        >
          {direction === 'asc' ? '↑' : '↓'}
        </button>
      ) : null}
    </div>
  );
}
