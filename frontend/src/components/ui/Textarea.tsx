import React, { forwardRef, useId } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || props.name || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={`w-full bg-surface-950/70 border rounded-xl py-2.5 px-4 text-white text-sm transition-all duration-200 placeholder:text-surface-600 focus-ring disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[90px] ${
            error
              ? "border-danger-500/80 focus:border-danger-400 focus:ring-danger-500/30"
              : "border-surface-800 focus:border-primary-500 focus:ring-primary-500/30"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger-400 mt-1.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-500 mt-1.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
