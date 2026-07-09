import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/images/logo/logo4.png";

interface NavbarLogoProps {
  href?: string;
  inverted?: boolean;
  iconOnly?: boolean;
}

const NavbarLogo = ({ href = "/", inverted = false, iconOnly = false }: NavbarLogoProps) => {
  if (iconOnly) {
    return (
      <Link href={href} className="flex items-center justify-center w-10 h-10">
        <Image
          src={logo}
          alt="CardioManager"
          className={`h-9 w-auto shrink-0 ${inverted ? "invert brightness-0" : ""}`}
        />
      </Link>
    );
  }
  return (
    <div className="flex items-center">
      <Link href={href} className="flex items-center gap-2">
        <Image
          src={logo}
          alt="CardioManager"
          className="h-9 w-auto shrink-0"
        />
        <span className={`text-lg font-extrabold tracking-tight ${inverted ? "text-white" : "text-slate-800"}`}>Cardio<span className={`font-normal ${inverted ? "text-white/80" : "text-slate-500"}`}>Manager</span></span>
      </Link>
    </div>
  );
};

export default NavbarLogo;
