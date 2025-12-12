
"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

// Extend InputProps to include a specific onValueChange callback
export interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: number | null;
  onValueChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, onBlur, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    const formatToCurrency = (num: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    React.useEffect(() => {
        if (value != null && value !== 0) {
            // Only format if not focused on it.
            if (document.activeElement !== ref) {
                setDisplayValue(formatToCurrency(value));
            }
        } else {
            setDisplayValue('');
        }
    }, [value, ref]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const sanitized = rawValue.replace(/[^0-9.]/g, '');
        setDisplayValue(sanitized);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const numericValue = parseFloat(e.target.value);
        if (!isNaN(numericValue)) {
            setDisplayValue(formatToCurrency(numericValue));
            onValueChange?.(numericValue);
        } else {
            setDisplayValue('');
            onValueChange?.(undefined);
        }
        onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const numericValue = parseFloat(e.target.value.replace(/[^0-9.,$]/g, ''));
        if (!isNaN(numericValue) && numericValue !== 0) {
            setDisplayValue(String(numericValue));
        } else {
            setDisplayValue('');
        }
        onFocus?.(e);
    }

    return (
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        ref={ref}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
