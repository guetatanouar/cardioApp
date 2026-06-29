import Image from "next/image";
import Link from "next/link";

interface NavbarLogoProps {
  href?: string;
  inverted?: boolean;
  iconOnly?: boolean;
  className?: string;
}

const NavbarLogo = ({ href = "/", inverted = false, iconOnly = false, className = "" }: NavbarLogoProps) => {
  return (
    <Link href={href} className={`flex items-center ${className}`}>
      <Image
        priority={false}
        src={iconOnly ? "/logo-icon.svg" : "/logo.svg"}
        alt="CareMManager - Retour à l'accueil"
        width={iconOnly ? 40 : 200}
        height={iconOnly ? 40 : 50}
        className={`w-auto ${iconOnly ? "h-8 sm:hidden" : "h-8"} ${inverted ? "brightness-0 invert" : ""}`}
        unoptimized
      />
    </Link>
  );
};

export default NavbarLogo;
