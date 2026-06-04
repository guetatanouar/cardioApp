"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const countries = [
  { code: "DZ", name: "Algérie", flag: "🇩🇿", prefix: "+213" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", prefix: "+49" },
  { code: "AT", name: "Autriche", flag: "🇦🇹", prefix: "+43" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", prefix: "+32" },
  { code: "BG", name: "Bulgarie", flag: "🇧🇬", prefix: "+359" },
  { code: "CA", name: "Canada", flag: "🇨🇦", prefix: "+1" },
  { code: "HR", name: "Croatie", flag: "🇭🇷", prefix: "+385" },
  { code: "DK", name: "Danemark", flag: "🇩🇰", prefix: "+45" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", prefix: "+20" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", prefix: "+34" },
  { code: "EE", name: "Estonie", flag: "🇪🇪", prefix: "+372" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", prefix: "+1" },
  { code: "FI", name: "Finlande", flag: "🇫🇮", prefix: "+358" },
  { code: "FR", name: "France", flag: "🇫🇷", prefix: "+33" },
  { code: "GR", name: "Grèce", flag: "🇬🇷", prefix: "+30" },
  { code: "HU", name: "Hongrie", flag: "🇭🇺", prefix: "+36" },
  { code: "IE", name: "Irlande", flag: "🇮🇪", prefix: "+353" },
  { code: "IT", name: "Italie", flag: "🇮🇹", prefix: "+39" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻", prefix: "+371" },
  { code: "LT", name: "Lituanie", flag: "🇱🇹", prefix: "+370" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", prefix: "+352" },
  { code: "MT", name: "Malte", flag: "🇲🇹", prefix: "+356" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", prefix: "+212" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", prefix: "+31" },
  { code: "PL", name: "Pologne", flag: "🇵🇱", prefix: "+48" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", prefix: "+351" },
  { code: "CZ", name: "République tchèque", flag: "🇨🇿", prefix: "+420" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴", prefix: "+40" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", prefix: "+44" },
  { code: "SK", name: "Slovaquie", flag: "🇸🇰", prefix: "+421" },
  { code: "SI", name: "Slovénie", flag: "🇸🇮", prefix: "+386" },
  { code: "SE", name: "Suède", flag: "🇸🇪", prefix: "+46" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", prefix: "+41" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", prefix: "+216" },
  { code: "TR", name: "Turquie", flag: "🇹🇷", prefix: "+90" },
];

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CountrySelect({ value, onChange, className = "" }: CountrySelectProps) {
  const selected = countries.find((c) => c.code === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background/80 px-3 text-sm hover:bg-accent/50 outline-none ${className}`}
        >
          {selected ? (
            <>
              <span className="text-base leading-none">{selected.flag}</span>
              <span className="flex-1 text-left">{selected.name}</span>
              <span className="text-xs text-muted-foreground">{selected.prefix}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Sélectionner un pays</span>
          )}
          <svg className="h-3 w-3 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-60 overflow-y-auto" align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {countries.map((c) => (
            <DropdownMenuRadioItem key={c.code} value={c.code} className="gap-2">
              <span className="text-base">{c.flag}</span>
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.prefix}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
