import * as React from "react";
import { cn } from "@/lib/utils";

export interface CapslockTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange?: (value: string) => void;
}

const CapslockTextarea = React.forwardRef<HTMLTextAreaElement, CapslockTextareaProps>(
  ({ className, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  }
);
CapslockTextarea.displayName = "CapslockTextarea";

export { CapslockTextarea };
