import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DiplomaBroIcon, type DiplomaBroState } from "@/components/shared/bro/DiplomaBroIcon";
import { Playground } from "./Playground";
import { BroButton } from "@/components/shared/bro/BroButton";

export const metadata: Metadata = { title: "DiplomaBro icon", robots: { index: false } };

const STATES: DiplomaBroState[] = ["idle", "thinking", "answering", "done", "notification", "locked"];
const SIZES = [24, 40, 56];

// Dev-only demo: every state at every size. Not served in production.
export default function BroIconDemo() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <h1 className="font-serif font-bold text-headline-lg text-on-surface">DiplomaBro icon</h1>
      <p className="text-body-md text-on-surface-variant">
        Glow is off below 32px. Turn on reduced motion to check nothing moves. Press ⌘K (or the button bottom-right) to see it fly into the bar.
      </p>
      <Playground />
      <div className="overflow-x-auto rounded-2xl bg-surface-container-lowest border border-outline-variant">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="px-lg py-sm text-label-md text-on-surface-variant">State</th>
              {SIZES.map((s) => (
                <th key={s} className="px-lg py-sm text-label-md text-on-surface-variant tabular-nums">
                  {s}px
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATES.map((state) => (
              <tr key={state} className="border-b border-outline-variant last:border-b-0">
                <td className="px-lg py-md text-body-md font-semibold text-on-surface">{state}</td>
                {SIZES.map((size) => (
                  <td key={size} className="px-lg py-md">
                    <DiplomaBroIcon state={state} size={size} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BroButton isPro />
    </div>
  );
}
