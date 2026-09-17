import { AlarmClockCheck, Timer } from "lucide-react";

export default function StepTimerMilestones() {
  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-headline-md font-serif font-bold text-on-surface">Timer & milestones</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Two more things worth knowing about before you start.
        </p>
      </div>
      <div className="flex flex-col gap-md">
        <div className="flex items-start gap-sm">
          <span className="p-sm rounded-lg bg-surface-container text-primary shrink-0">
            <Timer size={18} />
          </span>
          <div>
            <p className="text-label-md font-bold text-on-surface">Focus Timer</p>
            <p className="text-body-md text-on-surface-variant">
              A 25-minute Pomodoro timer in the top corner. Start it from any task&apos;s details, or on its own.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-sm">
          <span className="p-sm rounded-lg bg-surface-container text-primary shrink-0">
            <AlarmClockCheck size={18} />
          </span>
          <div>
            <p className="text-label-md font-bold text-on-surface">Milestones bar</p>
            <p className="text-body-md text-on-surface-variant">
              All-day deadlines (like an IA submission) live above the calendar, not inside a single time slot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
