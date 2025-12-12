
"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

// Extend InputProps to include a specific onValueChange callback
export interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: number | null;
  onValueChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    const format = (num: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    // Effect to format the value when it changes from the form state
    React.useEffect(() => {
        if (value != null) {
            setDisplayValue(format(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setDisplayValue(rawValue);
    };

    const handleBlur = () => {
        const numericValue = parseFloat(displayValue.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numericValue)) {
            setDisplayValue(format(numericValue));
            onValueChange?.(numericValue);
        } else {
            // Handle case where input is cleared or invalid
            setDisplayValue('');
            onValueChange?.(undefined);
        }
    };

    return (
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        ref={ref}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
