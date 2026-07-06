import { getCurrentUser } from "@/app/lib/get-current-user";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/app/lib/actions/profile";
import Image from "next/image";
import { Medal, Calendar, Share2 } from "lucide-react";
import Link from "next/link";
import ProfileInfo from "@/components/profile/ProfileInfo";
import { getSavedItems } from "@/app/lib/actions/saved-items";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const result = await getPublicProfile(userId);
  const currentUser = await getCurrentUser();
  const isOwnProfile = currentUser?.id === userId;
  if (!result.success) notFound();
  const {
    user,
    articles,
    resources,
    discussions,
    totalLikes,
    total_downloads,
    commentsWritten,
    drafts,
  } = result.data;
  const month = months[new Date(user.created_at).getMonth()];
  const final = month + " " + new Date(user.created_at).getFullYear();
  let savedItems = null;
  if (isOwnProfile) {
    const savedResult = await getSavedItems();
    if (savedResult.success) savedItems = savedResult.data;
  }
  return (
    <div className="flex flex-col">
      <div className="bg-surface-container-lowest flex flex-row gap-lg items-center py-[50px] border-b-1 border-outline-variant px-30">
        <Image
          src={user.avatar_url}
          height={200}
          width={200}
          alt="User Profile"
          className="rounded-[50%] border-1 border-outline-variant"
        />
        <div className="flex flex-row self-end justify-between flex-1">
          <div className="flex flex-col gap-md">
            <div className="flex flex-row gap-md">
              <h1 className="text-display-lg font-serif font-bold">
                {user.display_name}
              </h1>
              <h1 className="text-on-primary-fixed-variant text-headline-lg self-center font-bold">
                {user.is_pro ? "Diploma Pro" : ""}
              </h1>
            </div>
            <div className="flex flex-row gap-md">
              <div className="flex flex-row gap-sm">
                <Medal className="text-primary" />
                <h1 className="text-body-lg text-on-surface-variant font-bold">
                  {user.points} points
                </h1>
              </div>
              <div className="flex flex-row gap-sm">
                <Calendar className="text-primary" />
                <h1 className="text-body-lg text-on-surface-variant font-bold">
                  Joined {final}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex flex-row ml-auto gap-sm">
            {isOwnProfile && (
              <Link href={"/profile/edit"}>
                <div className="px-lg py-md bg-primary rounded-xl">
                  <h1 className="text-on-primary text-body-lg">Edit Profile</h1>
                </div>
              </Link>
            )}
            <Share2
              size={55}
              className="p-sm border-1 border-outline-variant rounded-xl text-primary cursor-pointer hover:bg-surface-container-low"
            />
          </div>
        </div>
      </div>
      <ProfileInfo
        resources={resources}
        discussions={discussions}
        articles={articles}
        totalLikes={totalLikes}
        total_downloads={total_downloads}
        commentsWritten={commentsWritten}
        bio={user.bio}
        trust={
          (resources[0] && resources[0].community_trust) ||
          user.author_trust_score
        }
        self={isOwnProfile}
        savedItems={savedItems}
        drafts={drafts}
      />
    </div>
  );
}
