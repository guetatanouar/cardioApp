"use client";

import * as React from "react";
import {
  AsYouType,
  CountryCode,
  parsePhoneNumber,
} from "libphonenumber-js";
import { cn } from "@/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const countries = [
  { code: "DZ" as CountryCode, name: "Algérie", flag: "🇩🇿", prefix: "+213" },
  { code: "FR" as CountryCode, name: "France", flag: "🇫🇷", prefix: "+33" },
  { code: "MA" as CountryCode, name: "Maroc", flag: "🇲🇦", prefix: "+212" },
  { code: "TN" as CountryCode, name: "Tunisie", flag: "🇹🇳", prefix: "+216" },
  { code: "GB" as CountryCode, name: "Royaume-Uni", flag: "🇬🇧", prefix: "+44" },
  { code: "US" as CountryCode, name: "États-Unis", flag: "🇺🇸", prefix: "+1" },
  { code: "CA" as CountryCode, name: "Canada", flag: "🇨🇦", prefix: "+1" },
  { code: "DE" as CountryCode, name: "Allemagne", flag: "🇩🇪", prefix: "+49" },
  { code: "IT" as CountryCode, name: "Italie", flag: "🇮🇹", prefix: "+39" },
  { code: "ES" as CountryCode, name: "Espagne", flag: "🇪🇸", prefix: "+34" },
  { code: "BE" as CountryCode, name: "Belgique", flag: "🇧🇪", prefix: "+32" },
  { code: "CH" as CountryCode, name: "Suisse", flag: "🇨🇭", prefix: "+41" },
  { code: "SA" as CountryCode, name: "Arabie Saoudite", flag: "🇸🇦", prefix: "+966" },
  { code: "AE" as CountryCode, name: "Émirats Arabes Unis", flag: "🇦🇪", prefix: "+971" },
  { code: "QA" as CountryCode, name: "Qatar", flag: "🇶🇦", prefix: "+974" },
  { code: "EG" as CountryCode, name: "Égypte", flag: "🇪🇬", prefix: "+20" },
  { code: "LB" as CountryCode, name: "Liban", flag: "🇱🇧", prefix: "+961" },
  { code: "SY" as CountryCode, name: "Syrie", flag: "🇸🇾", prefix: "+963" },
  { code: "TR" as CountryCode, name: "Turquie", flag: "🇹🇷", prefix: "+90" },
];

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
    ? countries.filter((c) => onlyCountries.includes(c.code))
    : countries;
  const initCountry = countryProp || defaultCountry;
  const [country, setCountry] = React.useState<CountryCode>(() => {
    if (value) {
      for (const c of countryList) {
        if (value.startsWith(c.prefix)) return c.code;
      }
    }
    return initCountry;
  });

  const selected = countryList.find((c) => c.code === country);

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d+]/g, "");
    try {
      const parsed = parsePhoneNumber(raw.startsWith("+") ? raw : `+${raw}`, country);
      if (parsed && parsed.nationalNumber.length > 15) return;
    } catch {
      const digitsOnly = raw.replace(/\D/g, "");
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
            <span className="text-base leading-none">{selected?.flag}</span>
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
    {error ? <p className="text-red-500 text-sm mt-1">{error}</p> : null}
  </div>
  );
}
