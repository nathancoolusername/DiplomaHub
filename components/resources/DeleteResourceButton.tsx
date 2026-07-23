"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteResource } from "@/app/lib/actions/resources";
import { Spinner } from "@/components/spinner";

export function DeleteResourceButton({ resourceId }: { resourceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this resource? This can't be undone.")) return;

    setLoading(true);
    setError(null);

    const result = await deleteResource(resourceId);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/resources");
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-on-surface-variant transition hover:text-red-500 hover:bg-surface-container p-sm rounded-xl cursor-pointer disabled:opacity-50"
      >
        {loading ? <Spinner size={30} /> : <Trash2 size={30} />}
      </button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
