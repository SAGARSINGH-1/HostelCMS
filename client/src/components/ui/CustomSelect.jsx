import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // supports both string[] and {label, value}[]
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  const selected = normalizedOptions.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-accent focus:outline-none"
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-1">
          {normalizedOptions.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex items-center justify-between cursor-pointer px-3 py-2 text-sm rounded-md
                ${value === opt.value
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
                }`}
            >
              {opt.label}

              {value === opt.value && (
                <Check className="h-4 w-4 opacity-70" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}