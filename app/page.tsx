import { GraduationCap } from "lucide-react";
import ResourceHome from "../components/home/article-section/article-home";
import Trending from "../components/home/trending";
import Image from "next/image";
import Link from "next/link";
import { getResourcesWithUserState } from "@/app/lib/actions/resources";
import { getDiscussions } from "@/app/lib/actions/discussions";

export default async function Home() {
  const resourcesResult = await getResourcesWithUserState({ limit: 6 });
  const resources = resourcesResult.success ? resourcesResult.data : [];

  const discussionsResult = await getDiscussions();
  const discussions = discussionsResult.success ? discussionsResult.data : [];

  return (
    <div className="flex flex-col">
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
          <h1 className="text-on-surface-variant text-body-lg w-full md:w-170 self-center place-self-center">
            The community platform for IB students, alumni, and educators.
            Collaborate, share resources, and navigate the IB journey together.
          </h1>
          <div className="mt-lg flex flex-col sm:flex-row gap-sm justify-center">
            <Link href={"/community"}>
              <button className="w-full sm:w-auto bg-primary text-on-primary px-lg py-md rounded-lg text-body-lg hover:opacity-90 transition-opacity cursor-pointer">
                <div className="flex flex-row items-center justify-center">
                  <h1 className="pr-sm">Explore community</h1>
                </div>
              </button>
            </Link>
            <Link href={"/resources"}>
              <button className="w-full sm:w-auto border-primary border-1 bg-surface-container-lowest text-primary px-lg py-md rounded-lg text-body-lg hover:bg-surface-container-high transition cursor-pointer">
                <div className="flex flex-row items-center justify-center">
                  <h1 className="pr-sm">Explore Resources</h1>
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
