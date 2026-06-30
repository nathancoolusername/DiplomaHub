import Link from "next/link";


export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant py-xl">
      <div className="max-w-[1280px] mx-md px-margin flex flex-col md:flex-row justify-between items-center gap-lg">
        <div className="flex flex-col gap-xs">
          <span className="font-serif text-headline-md text-primary">IBPeople</span>
        </div>
        </div>
    </footer>
  );
}