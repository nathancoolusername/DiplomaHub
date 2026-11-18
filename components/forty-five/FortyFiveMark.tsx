/** Four tier-coloured squares: the Forty-Five mark. */
export function FortyFiveMark() {
  return (
    <span aria-hidden="true" className="grid grid-cols-2 gap-[2px] shrink-0">
      <span className="h-[6px] w-[6px] rounded-[1px] bg-ff-1" />
      <span className="h-[6px] w-[6px] rounded-[1px] bg-ff-2" />
      <span className="h-[6px] w-[6px] rounded-[1px] bg-ff-3" />
      <span className="h-[6px] w-[6px] rounded-[1px] bg-ff-4" />
    </span>
  );
}
