import { DiplomaBroMark, type DiplomaBroState } from "./bro/DiplomaBroIcon";

/** Bro's face on every Bro surface: the DiplomaBro mark, decorative (the surrounding text says it's Bro). */
export function BroAvatar({ size = 32, className = "", state = "idle" }: { size?: number; className?: string; state?: DiplomaBroState }) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <DiplomaBroMark state={state} size={size} />
    </span>
  );
}
