import { getCurrentUser } from "@/app/lib/get-current-user";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/app/lib/actions/profile";
import Image from "next/image";
import { Medal, Calendar } from "lucide-react";
import Link from "next/link";
import ProfileInfo from "@/components/profile/ProfileInfo";
import { getSavedItems } from "@/app/lib/actions/saved-items";
import { initialsFor } from "@/app/lib/initials";
import { ShareButton } from "@/components/shareButton";
import { DiplomaProBadge } from "@/components/DiplomaProBadge";

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
      <div className="bg-surface-container-lowest flex flex-col md:flex-row gap-lg items-center py-[50px] border-b-1 border-outline-variant px-md md:px-10 xl:px-30">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            height={200}
            width={200}
            alt="User Profile"
            className="h-[90px] w-[90px] md:h-[200px] md:w-[200px] rounded-full object-cover"
          />
        ) : (
          <div className="h-[90px] w-[90px] md:h-[200px] md:w-[200px] rounded-full bg-surface-container border-1 border-outline-variant flex items-center justify-center text-primary font-bold text-display-lg">
            {initialsFor(user.display_name)}
          </div>
        )}
        <div className="flex flex-col md:flex-row md:self-end justify-between flex-1 w-full gap-md">
          <div className="flex flex-col gap-md items-center md:items-start text-center md:text-left">
            <div className="flex flex-row flex-wrap gap-md justify-center md:justify-start">
              <h1 className="text-display-lg font-serif font-bold">
                {user.display_name}
              </h1>
              {user.is_pro && (
                <DiplomaProBadge className="text-on-primary-fixed-variant text-headline-lg self-center font-bold" />
              )}
            </div>
            <div className="flex flex-row flex-wrap gap-md justify-center md:justify-start">
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
          <div className="flex flex-row md:ml-auto gap-sm justify-center">
            {isOwnProfile && (
              <Link href={"/profile/edit"}>
                <div className="px-lg py-md bg-primary rounded-xl">
                  <h1 className="text-on-primary text-body-lg">Edit Profile</h1>
                </div>
              </Link>
            )}
            <ShareButton
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
        profileUserId={userId}
        author={{
          display_name: user.display_name,
          is_pro: user.is_pro,
          ib_year: user.ib_year,
        }}
      />
    </div>
  );
}
