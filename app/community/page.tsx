import { Users } from "lucide-react";
import CommunityPage from "@/components/community/community";
import { getDiscussions } from "@/app/lib/actions/discussions";
import { createClient } from "@/app/lib/supabase/server";

export default async function Community() {
  const result = await getDiscussions();
  const data = result.success ? result.data : [];

  const supabase = await createClient();
  const { count: memberCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  return (
    <div className="flex flex-col">
      <div className="flex flex-row bg-primary-container h-100 py-margin px-30 justify-between items-center">
        <div className="flex flex-col w-200">
          <h1 className="text-display-lg font-serif text-on-primary">
            Discuss, Share, and Connect with IB students worldwide
          </h1>
          <h1 className="text-headline-md text-on-primary-container">
            The community for International Baccalaureate students to excel
            together.
          </h1>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-md pt-lg px-lg pb-xl flex items-center gap-4 backdrop-blur-sm mr-40">
          <div className="bg-white/15 rounded-xl p-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {memberCount ?? 0}+
            </p>
            <p className="text-xs font-semibold tracking-wide text-blue-100/80 uppercase">
              Active IB Students
            </p>
          </div>
        </div>
      </div>

      {!result.success && (
        <p className="text-red-500 px-30 py-margin">
          Failed to load discussions: {result.error}
        </p>
      )}

      <CommunityPage data={data} />
    </div>
  );
}
