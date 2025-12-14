'use client';

import * as React from 'react';

import { Input, type InputProps } from '@/components/ui/input';

import { useLanguage } from '../i18n/language-provider';

// Extend InputProps to include a specific onValueChange callback
export interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: number | null;
  onValueChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, onBlur, onFocus, ...props }, ref) => {
    const { formatCurrency, locale } = useLanguage();
    const [displayValue, setDisplayValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);

    const getSeparators = React.useCallback(() => {
      const formatted = new Intl.NumberFormat(locale, { style: 'decimal' }).format(1111.11);
      return {
        group: formatted[1],
        decimal: formatted[5],
      };
    }, [locale]);

    React.useEffect(() => {
      if (value != null && !isFocused) {
        setDisplayValue(formatCurrency(value));
      } else if (value != null && isFocused) {
        // Keep it as a raw number for editing
        const { group } = getSeparators();
        setDisplayValue(
          String(value)
            .replace(/\./g, getSeparators().decimal)
            .replace(new RegExp(`\\${group}`, 'g'), ''),
        );
      } else {
        setDisplayValue('');
      }
    }, [value, isFocused, formatCurrency, getSeparators]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const { decimal } = getSeparators();
      // Allow only numbers and the correct decimal separator
      const regex = new RegExp(`[^0-9${decimal}]`, 'g');
      const sanitized = rawValue.replace(regex, '');
      setDisplayValue(sanitized);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const { decimal } = getSeparators();
      const numericString = e.target.value.replace(decimal, '.');
      const numericValue = parseFloat(numericString);

      if (!isNaN(numericValue)) {
        setDisplayValue(formatCurrency(numericValue));
        onValueChange?.(numericValue);
      } else {
        setDisplayValue('');
        onValueChange?.(undefined);
      }
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      const { decimal, group } = getSeparators();
      // Convert formatted currency string back to a plain number string for editing
      const plainNumberString = e.target.value
        .replace(/[^0-9.,]/g, '') // Allow comma and dot initially
        .replace(group, '') // Remove thousand separators
        .replace(decimal, '.'); // Standardize decimal point

      const numericValue = parseFloat(plainNumberString);

      if (!isNaN(numericValue) && numericValue !== 0) {
        setDisplayValue(String(numericValue).replace('.', decimal));
      } else {
        setDisplayValue('');
      }
      onFocus?.(e);
    };

    return (
      <Input
        type="text" // Use text to allow for custom formatting
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        ref={ref}
        inputMode="decimal"
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
