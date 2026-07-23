import { GraduationCap } from "lucide-react";
import ResourceHome from "../components/home/article-section/article-home";
import Trending from "../components/home/trending";
import Image from "next/image";
import Link from "next/link";
import { getResourcesWithUserState } from "@/app/lib/actions/resources";
import { getDiscussions } from "@/app/lib/actions/discussions";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error_code?: string }>;
}) {
  const resourcesResult = await getResourcesWithUserState({ limit: 6 });
  const resources = resourcesResult.success ? resourcesResult.data : [];

  const discussionsResult = await getDiscussions();
  const discussions = discussionsResult.success ? discussionsResult.data : [];

  // Supabase redirects here (not to our /auth routes) when an email link's
  // OTP is invalid/expired — e.g. the recovery or signup-confirmation link
  // sat unused past its expiry window, or an email security scanner
  // pre-opened the link and silently burned the single-use token before the
  // real click. Can't tell which of the two flows it was from the error
  // alone, so point at both.
  const { error_code } = await searchParams;
  const linkExpired = error_code === "otp_expired";

  return (
    <div className="flex flex-col">
      {linkExpired && (
        <div className="bg-amber-50 border-b border-amber-200 px-md py-md text-center">
          <p className="text-sm text-amber-800">
            That link expired or was already used.{" "}
            <Link
              href="/forgot-password"
              className="underline font-semibold"
            >
              Request a new password reset
            </Link>
            , or if you were confirming your email, resend it from your{" "}
            <Link href="/profile/edit" className="underline font-semibold">
              profile
            </Link>
            .
          </p>
        </div>
      )}
      <div className="bg-surface-container-low min-h-[500px] md:h-[700px] flex flex-col items-center justify-content-center place-content-center px-md py-20">
        <div className="text-primary bg-surface-container-lowest p-sm flex flex-row gap-sm">
          <GraduationCap />
          <h1 className="text-body-lg text-primary">
            A RESOURCE FOR THE IB COMMUNITY
          </h1>
        </div>
        <div className="text-center">
          <h1 className="text-display-lg font-serif font-bold m-md">
            Diploma<b className="text-primary">Hub</b>,
          </h1>
          <h1 className="text-display-lg font-serif font-bold m-md text-primary italic mb-20">
            where IB students never graduate alone.
          </h1>
          <p className="text-on-surface-variant text-body-lg w-full md:w-170 self-center place-self-center">
            The community platform for IB students, alumni, and educators.
            Collaborate, share resources, and navigate the IB journey together.
          </p>
          <div className="mt-lg flex flex-col sm:flex-row gap-sm justify-center">
            <Link href={"/community"}>
              <button className="w-full sm:w-auto bg-primary text-on-primary px-lg py-md rounded-lg text-body-lg hover:opacity-90 transition-opacity cursor-pointer">
                <div className="flex flex-row items-center justify-center">
                  <span className="pr-sm">Explore community</span>
                </div>
              </button>
            </Link>
            <Link href={"/resources"}>
              <button className="w-full sm:w-auto border-primary border-1 bg-surface-container-lowest text-primary px-lg py-md rounded-lg text-body-lg hover:bg-surface-container-high transition cursor-pointer">
                <div className="flex flex-row items-center justify-center">
                  <span className="pr-sm">Explore Resources</span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      <ResourceHome data={resources} />

      <Trending discussions={discussions} />

      <div className="min-h-[300px] md:h-[400px] bg-primary py-lg px-md place-content-center">
        <div className="bg-primary-container flex flex-col md:flex-row rounded-xl justify-between items-center gap-md py-lg px-lg">
          <div className="flex flex-col py-lg px-lg gap-gutter">
            <span className="font-serif text-headline-lg text-on-primary font-bold flex flex-row">
              Want to see more DiplomaHub content?
            </span>
            <h1 className="text-body-lg text-surface-container-high">
              Get funny, interesting, and engaging videos delivered straight
              from the founders on Instagram.
            </h1>
          </div>
          <Link
            href={`https://www.instagram.com/the_diplomahub?igsh=aDhoZmQ5ZnRpeDc5`}
            target="_blank"
          >
            <Image
              src={"/insta-logo.png"}
              alt={"instagram logo"}
              height={100}
              width={200}
              className="cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
