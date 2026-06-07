export interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
}

export const countries: Country[] = [
  { code: "CA", name: "Canada", flag: "🇨🇦", prefix: "+1" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", prefix: "+1" },
  { code: "FR", name: "France", flag: "🇫🇷", prefix: "+33" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", prefix: "+32" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", prefix: "+41" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", prefix: "+213" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", prefix: "+212" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", prefix: "+216" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", prefix: "+44" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", prefix: "+49" },
  { code: "IT", name: "Italie", flag: "🇮🇹", prefix: "+39" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", prefix: "+34" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", prefix: "+31" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", prefix: "+351" },
  { code: "SE", name: "Suède", flag: "🇸🇪", prefix: "+46" },
  { code: "AT", name: "Autriche", flag: "🇦🇹", prefix: "+43" },
  { code: "DK", name: "Danemark", flag: "🇩🇰", prefix: "+45" },
  { code: "FI", name: "Finlande", flag: "🇫🇮", prefix: "+358" },
  { code: "IE", name: "Irlande", flag: "🇮🇪", prefix: "+353" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", prefix: "+352" },
  { code: "GR", name: "Grèce", flag: "🇬🇷", prefix: "+30" },
  { code: "PL", name: "Pologne", flag: "🇵🇱", prefix: "+48" },
  { code: "CZ", name: "République tchèque", flag: "🇨🇿", prefix: "+420" },
  { code: "HU", name: "Hongrie", flag: "🇭🇺", prefix: "+36" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴", prefix: "+40" },
  { code: "BG", name: "Bulgarie", flag: "🇧🇬", prefix: "+359" },
  { code: "HR", name: "Croatie", flag: "🇭🇷", prefix: "+385" },
  { code: "SK", name: "Slovaquie", flag: "🇸🇰", prefix: "+421" },
  { code: "SI", name: "Slovénie", flag: "🇸🇮", prefix: "+386" },
  { code: "EE", name: "Estonie", flag: "🇪🇪", prefix: "+372" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻", prefix: "+371" },
  { code: "LT", name: "Lituanie", flag: "🇱🇹", prefix: "+370" },
  { code: "MT", name: "Malte", flag: "🇲🇹", prefix: "+356" },
  { code: "SA", name: "Arabie Saoudite", flag: "🇸🇦", prefix: "+966" },
  { code: "AE", name: "Émirats Arabes Unis", flag: "🇦🇪", prefix: "+971" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", prefix: "+974" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", prefix: "+20" },
  { code: "LB", name: "Liban", flag: "🇱🇧", prefix: "+961" },
  { code: "SY", name: "Syrie", flag: "🇸🇾", prefix: "+963" },
  { code: "TR", name: "Turquie", flag: "🇹🇷", prefix: "+90" },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryByPrefix(prefix: string): Country | undefined {
  return countries.find((c) => c.prefix === prefix);
}

export function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag ?? "";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}
