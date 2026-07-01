"use client";

import * as React from "react";
import { countries, getCountryByCode } from "@/lib/countries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function FlagImage({ code, className = "h-4 w-6 shrink-0 rounded-sm object-cover" }: { code: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      className={className}
      loading="lazy"
    />
  );
}

export function CountrySelect({ value, onChange, className = "" }: CountrySelectProps) {
  const selected = getCountryByCode(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background/80 px-3 text-sm hover:bg-accent/50 outline-none ${className}`}
        >
          {selected ? (
            <>
              <FlagImage code={selected.code} />
              <span className="flex-1 text-left truncate">{selected.name}</span>
              <span className="text-xs font-mono text-muted-foreground shrink-0">{selected.code}</span>
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
              <FlagImage code={c.code} />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs font-mono text-muted-foreground">{c.code}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
