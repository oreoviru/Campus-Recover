import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      children,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full bg-surface-950/70 border rounded-xl py-2.5 pl-4 pr-10 text-white text-sm appearance-none focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-danger-500/80 focus:border-danger-400 focus:ring-danger-500/30"
                : "border-surface-800 focus:border-primary-500 focus:ring-primary-500/30"
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-surface-900 text-white">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 text-surface-500 pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-danger-400 mt-1.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-500 mt-1.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
