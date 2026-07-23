import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/app/lib/get-current-user";

export const metadata: Metadata = {
  title: "About",
  description:
    "DiplomaHub's mission is to help IB students never navigate the Diploma Programme alone — meet the team behind it.",
  alternates: { canonical: "/about" },
};

export default async function About() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/" : "/login";

  return (
    <div className="flex flex-col gap-[70px] bg-surface-container-low ">
      <div className="flex flex-col gap-margin justify-content-center items-center place-content-center min-h-[500px] md:h-[700px] px-md md:px-[60px] py-20">
        <p className="uppercase text-primary text-headline-md">
          Our community mission
        </p>
        <h1 className="text-display-lg font-serif font-bold">
          Empowering every IB student through shared wisdom.
        </h1>
        <p className="text-headline-md text-on-surface-variant text-center w-full md:w-300">
          DiplomaHub is the home for the next generation of global thinkers.
          We&apos;ve built a space where students and educators walk together,
          transforming the lifelong IB learner journey into a collaborative
          adventure defined by warmth, clarity, and mutual support.
        </p>
        <Link href={ctaHref}>
          <button
            className={`bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex flex-row gap-sm text-headline-md px-20 py-lg`}
          >
            Join the Community
          </button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:min-h-[600px] px-md md:px-[50px] py-[30px] gap-margin bg-surface-container-low">
        <div className="flex flex-col gap-lg md:basis-2/5">
          <h2 className="text-headline-lg font-serif font-bold">Our Journey</h2>
          <div className="h-1 w-15 border-t-5 border-primary rounded-xl " />
          <p className="text-body-lg text-on-surface-variant">
            From a simple idea to a polished <b>Free</b> website.
          </p>
        </div>
        <div className="flex flex-col gap-lg bg-surface-container-lowest border-1 border-outline-variant rounded-xl md:basis-3/5 p-lg md:p-[60px]  hover:drop-shadow-xl/10 transition hover:border-primary">
          <p className="text-sm/8 tracking-wide">
            We know what it feels like to work late nights, to try to find the
            &quot;perfect&quot; EE question, to withstand the pressure of IAs. DiplomaHub
            was founded by a group of top IB students who realized that while
            the IB is tough, nobody should have to navigate it alone.
          </p>
          <p className="font-serif text-headline-lg text-primary px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4 italic">
            &quot;The IB teaches you to think independently, but nobody said you have
            to figure it out alone.&quot;
          </p>
          <p className="text-sm/8 tracking-wide">
            Today, DiplomaHub is a thriving ecosystem. By blending modern
            technology with a clean design and academic values, we&apos;ve created a
            digital sanctuary where every student can find the &quot;calm competence&quot;
            they need to excel and, more importantly, to enjoy the process of
            learning.
          </p>
        </div>
      </div>

      <div className="flex flex-col px-md md:px-[50px] py-[30px] gap-lg">
        <h2 className="text-headline-lg font-serif font-bold self-center">
          The Hearts & Minds
        </h2>
        <p className="text-body-lg text-on-surface-variant self-center mb-10">
          Meet the students dedicated to making your IB experience exceptional.
        </p>
        <p className="text-headline-md text-primary font-bold font-serif rounded-full bg-surface-container-lowest p-md self-center">
          DP2 Students at Bonn International School
        </p>
        <div className="flex flex-col md:flex-row justify-between gap-lg">
          <div className="md:basis-3/5 flex flex-col rounded-xl justify-between px-lg py-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
            <div className="flex flex-col gap-lg self-center">
              <p className="uppercase text-primary text-headline-md">
                Founder & CTO
              </p>
              <h3 className="text-headline-lg font-serif font-bold ">
                Andy <b className="text-primary">Nathan</b> Pieume Tchiyep
              </h3>
              <p className="text-headline-md">
                Nathan built DiplomaHub from the ground up. He designed,
                developped, and shipped every part of the platform himself. His
                vision is simple: give every IB student access to the kind of
                practical resources that usually only comes from knowing the
                right people and the right spots to look for.
              </p>
            </div>
            <p className="font-serif text-headline-lg text-primary px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4 italic">
              &quot;I was a DP1 student with no idea what I was doing. DiplomaHub is
              what I wish existed then&quot;
            </p>
          </div>
          <div className="md:basis-2/5 flex flex-col gap-lg rounded-xl gap-lg">
            <div className="flex flex-col gap-lg rounded-xl p-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
              <p className="uppercase text-primary text-headline-md">
                Administrator
              </p>
              <h3 className="text-headline-lg font-serif font-bold ">
                <b className="text-primary">Sidarth</b> Pillai
              </h3>
              <p>
                Sidharth was one of the first people Nathan brought into
                DiplomaHub, contributing some of the platform&apos;s earliest
                articles and resources.
              </p>
            </div>
            <div className="flex flex-col gap-lg rounded-xl p-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
              <p className="uppercase text-primary text-headline-md">
                Administrator
              </p>
              <h3 className="text-headline-lg font-serif font-bold ">
                <b className="text-primary">Arnav</b> Kapoor
              </h3>
              <p>
                Arnav contributed articles and resources that became some of
                DiplomaHub&apos;s first content at launch. He brought a top student&apos;s
                eye to the platform&apos;s direction, pushing for things that would
                actually matter to the people using it.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-lg rounded-xl p-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
          <p className="uppercase text-primary text-headline-md">
            Administrator
          </p>
          <h3 className="text-headline-lg font-serif font-bold ">
            <b className="text-primary">Adarsh</b> Raghavan
          </h3>
          <p>
            Adarsh joined early and helped seed the platform with resources
            drawn directly from his own IB experience. Beyond the content, his
            design sense shaped many of the decisions that made DiplomaHub what
            it is today.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-margin justify-content-center items-center place-content-center bg-primary min-h-[300px] md:h-[400px] px-md md:px-[60px] py-[40px] ">
        <h2 className="text-display-lg font-serif font-bold text-on-primary">
          Ready to start your journey?
        </h2>
        <p className="text-headline-md text-on-primary text-center w-full md:w-300">
          Join other students and teachers who are redefining academic
          excellence through collaboration..
        </p>
        <Link href={ctaHref}>
          <button
            className={`bg-on-primary text-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex flex-row gap-sm text-headline-md px-20 py-lg`}
          >
            Join the Community
          </button>
        </Link>
      </div>
    </div>
  );
}
