import { Users } from "lucide-react";
import CommunityPage from "@/components/community/community";
import { SEED_DISCUSSIONS, Discussion } from "@/components/data";

export default function Community() {
  const data: Discussion[] = SEED_DISCUSSIONS;
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
            <p className="text-2xl font-bold text-white">###,###+</p>
            <p className="text-xs font-semibold tracking-wide text-blue-100/80 uppercase">
              Active IB Students
            </p>
          </div>
        </div>
      </div>

      <CommunityPage data={data} />
    </div>
  );
}
