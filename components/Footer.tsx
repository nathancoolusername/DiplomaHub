import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant py-xl mt-auto w-full h-5 pb-10">
      <div className="mx-md px-margin flex flex-row md:flex-row justify-between items-center gap-margin">
        <div className="flex flex-col gap-xs w-400">
          <span className="font-serif text-headline-md font-bold flex flex-row">
            Diploma<h1 className="text-primary">Hub</h1>
          </span>
          <h1 className="text-primary">
            Where IB students never graduate alone
          </h1>
        </div>
        <h1 className="text-on-surface-variant text-body-lg ml-auto">
          DiplomaHub has been developed independently from and is not endorsed
          by the International Baccalaureate Organization.
        </h1>
      </div>
    </footer>
  );
}
