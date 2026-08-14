import logo from "@/assets/sail-logo.png";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function SailLogo({ size = 64, className, priority = false }: Props) {
  return (
    <img
      src={logo}
      alt="SAIL Salem Steel Plant logo"
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
