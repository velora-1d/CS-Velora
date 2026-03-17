import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.02)]",
        className
      )}
      {...props}
    />
  );
}
