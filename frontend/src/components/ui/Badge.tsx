import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "warning" | "danger" | "surface" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "surface",
  size = "md",
  dot = false,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-mono font-medium rounded-full uppercase tracking-wider transition-colors";

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantStyles = {
    primary: "bg-primary-500/10 text-primary-300 border border-primary-500/25",
    accent: "bg-accent-500/10 text-accent-300 border border-accent-500/25",
    warning: "bg-warning-500/10 text-warning-400 border border-warning-500/25",
    danger: "bg-danger-500/10 text-danger-400 border border-danger-500/25",
    surface: "bg-surface-800 text-surface-300 border border-surface-700/60",
    outline: "bg-transparent text-surface-400 border border-surface-700",
  };

  const dotColors = {
    primary: "bg-primary-400",
    accent: "bg-accent-400",
    warning: "bg-warning-400",
    danger: "bg-danger-400",
    surface: "bg-surface-400",
    outline: "bg-surface-400",
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`}
        />
      )}
      {children}
    </span>
  );
};
