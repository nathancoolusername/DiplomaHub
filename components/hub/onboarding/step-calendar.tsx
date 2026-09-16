import { Hand, MousePointerClick, Move } from "lucide-react";

const POINTS = [
  { Icon: MousePointerClick, title: "Click a task", text: "Opens its details — due date, notes, stages, and a link to start a focus session." },
  { Icon: Hand, title: "Drag to reschedule", text: "Move a task to a new day or time by dragging it. On phones, use the time fields in its details instead of dragging." },
  { Icon: Move, title: "Drag the bottom edge", text: "Resize a task to change how long it's blocked out for." },
];

export default function StepCalendar() {
  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-headline-md font-serif font-bold text-on-surface">How the calendar works</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Just a normal week view — here is what you can interact with.
        </p>
      </div>
      <div className="flex flex-col gap-md">
        {POINTS.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-start gap-sm">
            <span className="p-sm rounded-lg bg-surface-container text-primary shrink-0">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-label-md font-bold text-on-surface">{title}</p>
              <p className="text-body-md text-on-surface-variant">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
