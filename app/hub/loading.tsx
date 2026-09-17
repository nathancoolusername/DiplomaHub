// Mirrors components/hub/hub.tsx's real layout (header, Today's Focus,
// milestones/timer row, calendar grid, deadlines/study-time row) so the
// page doesn't flash blank while its async data fetches resolve.
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container rounded-xl ${className}`} />;
}

export default function HubLoading() {
  return (
    <div className="flex flex-col gap-lg px-md md:px-lg xl:px-20 py-lg max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <Block className="h-9 w-56" />
        <div className="flex flex-wrap gap-sm">
          <Block className="h-10 w-32" />
          <Block className="h-10 w-32" />
          <Block className="h-10 w-28" />
        </div>
      </div>

      {/* Today's Focus */}
      <Block className="h-24 w-full" />

      {/* Milestones bar + focus timer */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-lg">
        <Block className="h-32 lg:col-span-9" />
        <Block className="h-32 lg:col-span-3" />
      </div>

      {/* Calendar grid */}
      <Block className="h-[500px] w-full" />

      {/* Upcoming deadlines / study time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <Block className="h-48" />
        <Block className="h-48" />
      </div>
    </div>
  );
}
