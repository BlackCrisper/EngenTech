import * as React from "react";
import { cn } from "@/lib/utils";

export interface CapslockInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

const CapslockInput = React.forwardRef<HTMLInputElement, CapslockInputProps>(
  ({ className, type, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.toUpperCase();
      event.target.value = value;
      
      if (onChange) {
        onChange(event);
      }
      
      if (onValueChange) {
        onValueChange(value);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  }
);
CapslockInput.displayName = "CapslockInput";

export { CapslockInput };
