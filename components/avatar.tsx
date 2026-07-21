import Image from "next/image";
import { initialsFor } from "@/app/lib/initials";

export function Avatar({
  src,
  name,
  size,
  className = "",
}: {
  src?: string | null;
  name: string;
  size: number;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        width={size}
        height={size}
        alt={name}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-surface-container-low border-1 border-outline-variant flex items-center justify-center text-primary font-bold shrink-0 ${className}`}
    >
      {initialsFor(name)}
    </div>
  );
}
