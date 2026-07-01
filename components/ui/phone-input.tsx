"use client";

import * as React from "react";
import {
  AsYouType,
  CountryCode,
  parsePhoneNumber,
} from "libphonenumber-js";
import { cn } from "@/lib/cn";
import { countries, getPhoneLengthError, getPhoneMaxDigits } from "@/lib/countries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country?: CountryCode;
  defaultCountry?: CountryCode;
  className?: string;
  inputClass?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onlyCountries?: CountryCode[];
  error?: string;
}

export function PhoneInput({
  value,
  onChange,
  country: countryProp,
  defaultCountry = "CA",
  className,
  inputClass,
  placeholder = "+1 (514) 555-1234",
  disabled,
  required,
  onlyCountries,
  error,
}: PhoneInputProps) {
  const countryList = onlyCountries
    ? countries.filter((c) => onlyCountries.includes(c.code as CountryCode))
    : countries;
  const initCountry = countryProp || defaultCountry;
  const [country, setCountry] = React.useState<CountryCode>(() => {
    if (value) {
      for (const c of countryList) {
        if (value.startsWith(c.prefix)) return c.code as CountryCode;
      }
    }
    return initCountry;
  });

  const selected = countryList.find((c) => c.code === country);

  const countryError = React.useMemo(() => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    const maxDigits = getPhoneMaxDigits(country);
    if (maxDigits !== null && digits.length > maxDigits) {
      return getPhoneLengthError(country);
    }
    return null;
  }, [value, country]);

  const displayError = error || countryError;

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d+]/g, "");
    const maxDigits = getPhoneMaxDigits(country);
    try {
      const parsed = parsePhoneNumber(raw.startsWith("+") ? raw : `+${raw}`, country);
      if (parsed) {
        const nationalLen = parsed.nationalNumber.length;
        if (maxDigits !== null && nationalLen > maxDigits) return;
        if (maxDigits === null && nationalLen > 15) return;
      }
    } catch {
      const digitsOnly = raw.replace(/\D/g, "");
      if (maxDigits !== null && digitsOnly.length > maxDigits) return;
      if (digitsOnly.length > 15) return;
    }
    const formatter = new AsYouType(country);
    onChange(formatter.input(raw));
  }

  function handleCountrySelect(code: string) {
    const c = code as CountryCode;
    setCountry(c);
    if (value) {
      const prefix = countryList.find((x) => x.code === c)?.prefix ?? "+1";
      const raw = value.replace(/[^\d+]/g, "");
      const withoutPrefix = raw.replace(/^\+\d+/, "");
      const formatter = new AsYouType(c);
      onChange(formatter.input(prefix + withoutPrefix));
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-l-xl border border-r-0 border-input bg-background/80 px-3 py-2 text-sm hover:bg-accent/50 disabled:opacity-50 shrink-0 outline-none"
          >
            <img src={`https://flagcdn.com/w40/${selected!.code.toLowerCase()}.png`} alt={selected!.code} className="h-4 w-6 rounded-sm object-cover" />
            <span className="text-xs text-muted-foreground">{selected?.prefix}</span>
            <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 overflow-y-auto" align="start">
          <DropdownMenuRadioGroup value={country} onValueChange={handleCountrySelect}>
            {countryList.map((c) => (
              <DropdownMenuRadioItem key={c.code} value={c.code} className="gap-2">
                <span className="text-base">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.prefix}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="tel"
        value={value}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClass || cn(
          "flex h-10 w-full rounded-r-xl border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
    </div>
    {displayError ? <p className="text-red-500 text-sm mt-1">{displayError}</p> : null}
  </div>
  );
}
