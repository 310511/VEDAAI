import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-sm active:scale-[0.98]",
  secondary:
    "border border-border-strong bg-surface text-ink hover:bg-canvas",
  ghost: "text-muted hover:text-ink hover:bg-canvas",
  danger: "bg-danger text-white hover:bg-red-800",
};

const sizes: Record<Size, string> = {
  sm: "min-h-[44px] px-3.5 py-1.5 text-sm rounded-lg md:min-h-0",
  md: "min-h-[44px] px-5 py-2.5 text-sm rounded-lg md:min-h-0",
  lg: "min-h-[44px] px-6 py-3 text-sm rounded-xl md:min-h-0",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
