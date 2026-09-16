import { CalendarDays, ListChecks, Timer } from "lucide-react";

const POINTS = [
  { Icon: CalendarDays, text: "A week-at-a-glance calendar for IB assessments, personal tasks, and study blocks." },
  { Icon: ListChecks, text: "Milestones and deadlines stay visible up top, so nothing sneaks up on you." },
  { Icon: Timer, text: "A built-in focus timer for whenever you're ready to actually sit down and work." },
];

export default function StepWelcome() {
  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-headline-md font-serif font-bold text-on-surface">Welcome to the Hub</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Your personal IB planner — here is the quick version before you dive in.
        </p>
      </div>
      <div className="flex flex-col gap-md">
        {POINTS.map(({ Icon, text }) => (
          <div key={text} className="flex items-start gap-sm">
            <span className="p-sm rounded-lg bg-surface-container text-primary shrink-0">
              <Icon size={18} />
            </span>
            <p className="text-body-md text-on-surface pt-1">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
