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
