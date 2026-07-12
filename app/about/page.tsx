import Link from "next/link";
import { getCurrentUser } from "@/app/lib/get-current-user";

export default async function About() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/" : "/login";

  return (
    <div className="flex flex-col gap-[70px] bg-surface-container-low ">
      <div className="flex flex-col gap-margin justify-content-center items-center place-content-center h-[700px] px-[60px] ">
        <h1 className="uppercase text-primary text-headline-md">
          Our community mission
        </h1>
        <h1 className="text-display-lg font-serif font-bold">
          Empowering every IB student through shared wisdom.
        </h1>
        <h1 className="text-headline-md text-on-surface-variant text-center w-300">
          DiplomaHub is the home for the next generation of global thinkers.
          We've built a space where students and educators walk together,
          transforming the lifelong IB learner journey into a collaborative
          adventure defined by warmth, clarity, and mutual support.
        </h1>
        <Link href={ctaHref}>
          <button
            className={`bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex flex-row gap-sm text-headline-md px-20 py-lg`}
          >
            Join the Community
          </button>
        </Link>
      </div>

      <div className="flex flex-row justify-between h-min-[600px] px-[50px] py-[30px] gap-margin bg-surface-container-low">
        <div className="flex flex-col gap-lg basis-2/5">
          <h1 className="text-headline-lg font-serif font-bold">Our Journey</h1>
          <div className="h-1 w-15 border-t-5 border-primary rounded-xl " />
          <h1 className="text-body-lg text-on-surface-variant">
            From a simple idea to a polished <b>Free</b> website.
          </h1>
        </div>
        <div className="flex flex-col gap-lg bg-surface-container-lowest border-1 border-outline-variant rounded-xl basis-3/5 p-[60px]  hover:drop-shadow-xl/10 transition hover:border-primary">
          <h1 className="text-sm/8 tracking-wide">
            We know what it feels like to work late nights, to try to find the
            "perfect" EE question, to withstand the pressure of IAs. DiplomaHub
            was founded by a group of top IB students who realized that while
            the IB is tough, nobody should have to navigate it alone.
          </h1>
          <p className="font-serif text-headline-lg text-primary px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4 italic">
            "The IB teaches you to think independently, but nobody said you have
            to figure it out alone."
          </p>
          <h1 className="text-sm/8 tracking-wide">
            Today, DiplomaHub is a thriving ecosystem. By blending modern
            technology with a clean design and academic values, we've created a
            digital sanctuary where every student can find the "calm competence"
            they need to excel and, more importantly, to enjoy the process of
            learning.
          </h1>
        </div>
      </div>

      <div className="flex flex-col h-min-[700px] px-[50px] py-[30px] gap-lg">
        <h1 className="text-headline-lg font-serif font-bold self-center">
          The Hearts & Minds
        </h1>
        <h1 className="text-body-lg text-on-surface-variant self-center mb-10">
          Meet the students dedicated to making your IB experience exceptional.
        </h1>
        <h1 className="text-headline-md text-primary font-bold font-serif rounded-full bg-surface-container-lowest p-md self-center">
          DP2 Students at Bonn International School
        </h1>
        <div className="flex flex-row justify-between gap-lg">
          <div className="basis-3/5 flex flex-col rounded-xl justify-between px-lg py-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
            <div className="flex flex-col gap-lg self-center">
              <h1 className="uppercase text-primary text-headline-md">
                Founder & CTO
              </h1>
              <h1 className="text-headline-lg font-serif font-bold ">
                Andy <b className="text-primary">Nathan</b> Pieume Tchiyep
              </h1>
              <h1 className="text-headline-md">
                Nathan built DiplomaHub from the ground up. He designed,
                developped, and shipped every part of the platform himself. His
                vision is simple: give every IB student access to the kind of
                practical resources that usually only comes from knowing the
                right people and the right spots to look for.
              </h1>
            </div>
            <p className="font-serif text-headline-lg text-primary px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4 italic">
              "I was a DP1 student with no idea what I was doing. DiplomaHub is
              what I wish existed then"
            </p>
          </div>
          <div className="basis-2/5 flex flex-col gap-lg rounded-xl gap-lg">
            <div className="flex flex-col gap-lg rounded-xl p-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
              <h1 className="uppercase text-primary text-headline-md">
                Administrator
              </h1>
              <h1 className="text-headline-lg font-serif font-bold ">
                <b className="text-primary">Sidarth</b> Pillai
              </h1>
              <h1>
                Sidharth was one of the first people Nathan brought into
                DiplomaHub, contributing some of the platform's earliest
                articles and resources.
              </h1>
            </div>
            <div className="flex flex-col gap-lg rounded-xl p-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
              <h1 className="uppercase text-primary text-headline-md">
                Administrator
              </h1>
              <h1 className="text-headline-lg font-serif font-bold ">
                <b className="text-primary">Arnav</b> Kapoor
              </h1>
              <h1>
                Arnav contributed articles and resources that became some of
                DiplomaHub's first content at launch. He brought a top student's
                eye to the platform's direction, pushing for things that would
                actually matter to the people using it.
              </h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-lg rounded-xl p-lg bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
          <h1 className="uppercase text-primary text-headline-md">
            Administrator
          </h1>
          <h1 className="text-headline-lg font-serif font-bold ">
            <b className="text-primary">Adarsh</b> Raghavan
          </h1>
          <h1>
            Adarsh joined early and helped seed the platform with resources
            drawn directly from his own IB experience. Beyond the content, his
            design sense shaped many of the decisions that made DiplomaHub what
            it is today.
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-margin justify-content-center items-center place-content-center bg-primary h-[400px] px-[60px] py-[40px] ">
        <h1 className="text-display-lg font-serif font-bold text-on-primary">
          Ready to start your journey?
        </h1>
        <h1 className="text-headline-md text-on-primary text-center w-300">
          Join other students and teachers who are redefining academic
          excellence through collaboration..
        </h1>
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
