import Link from "next/link";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant py-xl mt-auto w-full pb-10">
      <div className="mx-md px-margin flex flex-col md:flex-row justify-between items-center gap-margin">
        <div className="flex flex-col gap-xs items-center md:items-start text-center md:text-left">
          <Logo />
          <p className="text-primary">
            Where IB students never graduate alone
          </p>
        </div>
        <div className="flex flex-col items-center justify-content-center gap-xs md:ml-auto text-center">
          <p className="text-on-surface-variant text-body-lg">
            DiplomaHub has been developed independently from and is not endorsed
            by the International Baccalaureate Organization.
          </p>
          <div className="flex flex-row flex-wrap justify-center gap-margin">
            <Link
              href="/legal/impressum"
              className="text-on-surface-variant text-body-md hover:text-primary hover:underline"
            >
              Impressum
            </Link>
            <Link
              href="/legal/privacy-policy"
              className="text-on-surface-variant text-body-md hover:text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/terms-of-service"
              className="text-on-surface-variant text-body-md hover:text-primary hover:underline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
