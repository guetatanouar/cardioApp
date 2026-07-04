import Image from "next/image";
import Link from "next/link";

interface NavbarLogoProps {
  href?: string;
}

const NavbarLogo = ({ href = "/" }: NavbarLogoProps) => {
  return (
    <div className="lg:col-span-2 flex justify-center">
      <Link href={href} className="w-logo-sm lg:w-logo-lg">
        <Image priority={false} src="/logo4.png" alt="CardioManager" width={180} height={60} className="w-full py-2 object-contain" />
      </Link>
    </div>
  );
};

export default NavbarLogo;
