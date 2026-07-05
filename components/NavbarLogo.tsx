import Link from "next/link";

interface NavbarLogoProps {
  href?: string;
  inverted?: boolean;
  iconOnly?: boolean;
}

const NavbarLogo = ({ href = "/", inverted = false, iconOnly = false }: NavbarLogoProps) => {
  if (iconOnly) {
    return (
      <Link href={href} className="flex items-center justify-center w-10 h-10">
        <svg viewBox="0 0 48 48" fill="none" className={`h-9 w-9 ${inverted ? "invert brightness-0" : ""}`}>
          <path d="M24 40C24 40 8 26 8 16C8 9.5 12.5 5 18 5C22 5 24 9 24 11C24 9 26 5 30 5C35.5 5 40 9.5 40 16C40 26 24 40 24 40Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5"/>
          <path d="M19 16L24 12L29 16L28 22L24 25L20 22L19 16Z" fill="white" opacity="0.9"/>
        </svg>
      </Link>
    );
  }
  return (
    <div className={`flex items-center ${inverted ? "invert brightness-0" : ""}`}>
      <Link href={href} className="flex items-center gap-2">
        <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9 shrink-0">
          <path d="M24 40C24 40 8 26 8 16C8 9.5 12.5 5 18 5C22 5 24 9 24 11C24 9 26 5 30 5C35.5 5 40 9.5 40 16C40 26 24 40 24 40Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5"/>
          <path d="M19 16L24 12L29 16L28 22L24 25L20 22L19 16Z" fill="white" opacity="0.9"/>
        </svg>
        <span className="text-lg font-extrabold tracking-tight text-slate-800">Care<span className="font-normal text-slate-500">Manager</span></span>
      </Link>
    </div>
  );
};

export default NavbarLogo;