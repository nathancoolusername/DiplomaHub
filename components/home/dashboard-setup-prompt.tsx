import Link from "next/link";
import { Sparkles } from "lucide-react";
import Button from "../button";

export default function DashboardSetupPrompt() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col items-center text-center gap-md">
      <Sparkles size={32} className="text-primary" aria-hidden="true" />
      <h2 className="text-headline-md font-serif font-bold text-on-surface">Set up your Hub</h2>
      <p className="text-body-lg text-on-surface-variant max-w-120">
        Pick the subjects you&apos;re taking and the Hub will build your calendar and recommend
        resources for exactly what you&apos;re studying.
      </p>
      <Link href="/hub">
        <Button className="text-body-lg">Pick your subjects</Button>
      </Link>
    </div>
  );
}
