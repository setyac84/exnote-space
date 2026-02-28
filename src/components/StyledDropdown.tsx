import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyledDropdownProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  className?: string;
}

const StyledDropdown = <T extends string>({ value, onChange, options, placeholder, className }: StyledDropdownProps<T>) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground hover:border-primary/40 transition-colors">
        <span className={!selected ? 'text-muted-foreground' : ''}>{selected?.label || placeholder || 'Select...'}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-2xl shadow-xl z-[70] p-2 max-h-[220px] overflow-y-auto space-y-1">
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn('w-full text-left px-3 py-2 text-sm rounded-xl transition-colors',
                value === opt.value ? 'font-medium bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60 hover:text-accent-foreground')}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StyledDropdown;
