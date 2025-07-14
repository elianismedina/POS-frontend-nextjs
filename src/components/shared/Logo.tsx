import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "", width = 64, height = 64 }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/assets/images/LogoPladiv.svg"
        alt="Pladiv Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
