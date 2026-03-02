import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  allLabel?: string;
}

const FilterDropdown = ({ options, value, onChange, placeholder, allLabel = 'All' }: FilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-secondary/50 text-foreground hover:border-primary/40 transition-colors"
      >
        <span className="truncate max-w-[140px]">{selected?.label || placeholder}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 min-w-[180px] max-h-[260px] overflow-y-auto">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={cn('w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', !value && 'font-medium text-primary')}
            >
              {allLabel}
            </button>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn('w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors truncate', value === opt.value && 'font-medium text-primary')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;
