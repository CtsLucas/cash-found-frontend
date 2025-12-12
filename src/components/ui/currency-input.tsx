"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

const CurrencyInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, ...props }, ref) => {
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, "");
      const numberValue = Number(value) / 100;

      const formattedValue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(numberValue);

      e.target.value = formattedValue;
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <Input
        type="text"
        onChange={handleValueChange}
        ref={ref}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };