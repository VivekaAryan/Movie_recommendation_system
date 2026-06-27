import { SORT_GROUPS, SORT_OPTIONS } from "../lib/sortRecommendations";

export default function SortControls({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <label htmlFor="sort-recommendations" className="text-sm font-medium text-pastel-muted">
        Sort by
      </label>
      <select
        id="sort-recommendations"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-w-[12rem] max-w-full rounded-xl border border-pastel-border bg-pastel-surface px-3 py-2 text-sm text-pastel-text shadow-sm transition focus:border-pastel-lilac-deep/50 focus:outline-none focus:ring-2 focus:ring-pastel-lilac/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {SORT_GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {SORT_OPTIONS.filter((option) => option.group === group).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
