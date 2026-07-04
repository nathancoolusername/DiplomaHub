import Link from "next/link";


export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant py-xl mt-auto w-full h-20">
      <div className="max-w-[1280px] mx-md px-margin flex flex-col md:flex-row justify-between items-center gap-lg">
        <div className="flex flex-col gap-xs">
          <span className="font-serif text-headline-md text-primary">IBPeople</span>
        </div>
        </div>
    </footer>
  );
}