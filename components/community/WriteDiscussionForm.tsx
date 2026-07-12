"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  createDiscussion,
  updateDiscussion,
} from "@/app/lib/actions/discussions";
import SortDropdown from "@/components/articles/drop-down";
import { SubjectTags, YEAR_OPTIONS } from "@/components/pills";
import { typeTags } from "./discussion-panel";

type SubmitStatus = "idle" | "saving" | "error";

type EditableDiscussion = {
  id: string;
  title: string;
  content: string;
  subject_tag: string | null;
  type_tag: string | null;
  year_tag: string | null;
};

const subjectOptions = Object.keys(SubjectTags);
const typeOptions = Object.keys(typeTags);

export default function WriteDiscussionForm({
  discussion,
}: {
  discussion?: EditableDiscussion;
}) {
  const isEditing = !!discussion;
  const [subject, setSubject] = useState(discussion?.subject_tag ?? "");
  const [type, setType] = useState(discussion?.type_tag ?? "");
  const [year, setYear] = useState(discussion?.year_tag ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);

    const title = (formData.get("title") as string)?.trim();
    if (!title) {
      setError("Title is required");
      setStatus("error");
      return;
    }
    if (!subject) {
      setError("Please select a subject");
      setStatus("error");
      return;
    }
    if (!type) {
      setError("Please select a type");
      setStatus("error");
      return;
    }
    if (!year) {
      setError("Please select a year");
      setStatus("error");
      return;
    }
    const content = (formData.get("content") as string)?.trim();
    if (!content) {
      setError("Content is required");
      setStatus("error");
      return;
    }

    setStatus("saving");

    formData.set("subject_tag", subject);
    formData.set("type_tag", type);
    formData.set("year_tag", year);

    const result = isEditing
      ? await updateDiscussion(discussion.id, formData)
      : await createDiscussion(formData);

    if (!result.success) {
      setError(result.error);
      setStatus("error");
      return;
    }

    router.push("/community");
  }

  return (
    <div className="flex flex-col px-md md:px-10 xl:px-45 py-10 gap-gutter bg-surface-container-low">
      <div className="flex flex-row gap-sm items-center">
        <Link href={"/community"}>
          <h1 className={`text-on-surface-variant text-headline-md uppercase`}>
            Community
          </h1>
        </Link>
        <ChevronRight />
        <h1 className={`text-primary text-headline-md uppercase`}>
          {isEditing ? "edit" : "start discussion"}
        </h1>
      </div>
      <div className="flex flex-col bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant gap-lg">
        <h1 className="text-primary font-serif text-display-lg font-bold">
          {isEditing ? "Edit Your Discussion" : "Start a Discussion"}
        </h1>
        <h1 className="text-on-surface-variant text-body-md mb-5">
          Ask a question, share an idea, or get help from the IB community.
        </h1>
        <form action={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
              Title
            </label>
            <input
              name="title"
              required
              defaultValue={discussion?.title}
              className="w-full border-1 border-outline-variant rounded-lg px-3 py-4"
              placeholder="e.g., How do I approach the Physics IA evaluation?"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Subject
              </label>
              <SortDropdown
                selected={subject}
                handleClick={setSubject}
                options={subjectOptions}
                placeholder="Select Subject"
              />
            </div>
            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Type
              </label>
              <SortDropdown
                selected={type}
                handleClick={setType}
                options={typeOptions}
                placeholder="Select Type"
              />
            </div>
            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Year
              </label>
              <SortDropdown
                selected={year}
                handleClick={setYear}
                options={YEAR_OPTIONS}
                placeholder="Select Year"
              />
            </div>
          </div>

          <div>
            <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
              Content
            </label>
            <textarea
              name="content"
              rows={8}
              defaultValue={discussion?.content}
              className="w-full border-1 border-outline-variant rounded-lg px-3 py-4"
              placeholder="Share the details..."
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer px-lg py-sm disabled:opacity-50"
          >
            {status === "saving"
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Post Discussion"}
          </button>
        </form>
      </div>
    </div>
  );
}
