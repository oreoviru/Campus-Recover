import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  className = "",
  ...props
}) => {
  const variantStyles = {
    text: "h-4 w-full rounded",
    rectangular: "rounded-2xl",
    circular: "rounded-full",
  };

  return (
    <div
      className={`skeleton bg-surface-800/80 animate-pulse ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
    <Skeleton className="h-6 w-3/4 rounded-lg" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="pt-4 border-t border-surface-800/60 flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20 rounded-xl" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-850/40 animate-pulse">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" className="w-8 h-8" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);
