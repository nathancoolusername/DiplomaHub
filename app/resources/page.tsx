import { Upload } from "lucide-react";
import Button from "../../components/button";
import ResourceGrid from "@/components/resources/resources-grid";
import { getResourcesWithUserState } from "../lib/actions/resources";
import Link from "next/link";

export default async function ResourcesPage() {
  const result = await getResourcesWithUserState();

  if (!result.success) {
    return (
      <p className="text-red-500">Failed to load resources: {result.error}</p>
    );
  }
  return (
    <div className="flex flex-col bg-surface-bright px-margin py-lg gap-margin">
      <div className="flex flex-col md:flex-row justify-between gap-md py-margin">
        <div>
          <h1 className="text-display-lg font-serif font-bold">
            Resources Vault
          </h1>
          <h1 className="text-on-surface-variant text-body-lg w-full md:w-170">
            Practical IB materials, exemplars, revision guides, and much more
            curated for the rigorous academic journey.
          </h1>
        </div>
        <Link href={"/resources/upload"}>
          <Button className="h-12 self-center text-body-lg">
            <div className="flex flex-row items-center gap-sm text-label-md font-sans">
              <Upload />
              Upload Resource
            </div>
          </Button>
        </Link>
      </div>

      <ResourceGrid data={result.data} />
    </div>
  );
}
