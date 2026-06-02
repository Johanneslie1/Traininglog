interface ViewToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ViewToggleProps<T extends string> {
  value: T;
  options: ViewToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

function ViewToggle<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: ViewToggleProps<T>) {
  return (
    <div className={`inline-flex rounded-full border border-border bg-bg-tertiary p-1 ${className}`} role="group" aria-label="View density">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-[34px] rounded-full px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary ${
              isActive
                ? 'bg-accent-primary text-text-on-accent shadow-glow'
                : 'text-text-secondary hover:bg-hover-overlay hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ViewToggle;
