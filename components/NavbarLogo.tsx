import Image from "next/image";
import logo from "@/assets/images/logo/logo.svg";
import Link from "next/link";

interface NavbarLogoProps {
  href?: string;
  inverted?: boolean;
}

const NavbarLogo = ({ href = "/", inverted = false }: NavbarLogoProps) => {
  return (
    <div className={`lg:col-span-2 flex justify-center ${inverted ? "invert brightness-0" : ""}`}>
      <Link href={href} className="w-logo-sm lg:w-logo-lg">
        <Image priority={false} src={logo} alt="logo CareMManager" className="w-full py-2" />
      </Link>
    </div>
  );
};

export default NavbarLogo;
