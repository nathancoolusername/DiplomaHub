"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  UploadCloud,
  FileText,
  X,
  Verified,
  ShieldCheck,
  Hd,
  Link2,
} from "lucide-react";
import { createResource, updateResource } from "@/app/lib/actions/resources";
import { createClient } from "@/app/lib/supabase/client";
import { Spinner } from "@/components/spinner";
import {
  validateFile,
  RESOURCE_FILE_TYPES,
  RESOURCE_FILE_MAX_BYTES,
} from "@/app/lib/uploadValidation";
import { useState, useRef, ChangeEvent, DragEvent, MouseEvent } from "react";
import SortDropdown from "@/components/articles/drop-down";
import { SubjectTags, ResourceTypeTag, YEAR_OPTIONS } from "@/components/pills";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type EditableResource = {
  id: string;
  title: string;
  description: string | null;
  subject_tag: string;
  type_tag: string;
  year_tag: string | null;
  file_url: string | null;
};

const optionsSubject = Object.keys(SubjectTags);
const optionsType = Object.keys(ResourceTypeTag);
const optionsYear = YEAR_OPTIONS;

export default function UploadResourceForm({
  resource,
}: {
  resource?: EditableResource;
}) {
  const isEditing = !!resource;
  const [subject, setSubject] = useState(resource?.subject_tag ?? "");
  const [type, setType] = useState(resource?.type_tag ?? "");
  const [year, setYear] = useState(resource?.year_tag ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState(
    resource?.type_tag === "External Link" ? (resource.file_url ?? "") : "",
  );
  const [existingFileUrl, setExistingFileUrl] = useState(
    resource?.type_tag !== "External Link" ? (resource?.file_url ?? null) : null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const handleClickS = (select: string) => setSubject(select);
  const handleClickT = (select: string) => setType(select);
  const handleClickY = (select: string) => setYear(select);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isExternalLink = type === "External Link";

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setExistingFileUrl(null);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
      setExistingFileUrl(null);
    }
  }

  function clearFile(e: MouseEvent) {
    e.stopPropagation();
    setFile(null);
    setExistingFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    if (!subject) {
      setError("Please select a subject");
      setStatus("error");
      return;
    }
    if (!type) {
      setError("Please select a resource type");
      setStatus("error");
      return;
    }
    if (!year) {
      setError("Please select a year");
      setStatus("error");
      return;
    }

    setStatus("uploading");

    let fileUrl = existingFileUrl ?? "";
    if (isExternalLink) {
      if (!linkUrl) {
        setError("Enter a link to the resource");
        setStatus("error");
        return;
      }
      fileUrl = linkUrl;
    } else if (file) {
      const validated = validateFile(file, RESOURCE_FILE_TYPES, RESOURCE_FILE_MAX_BYTES);
      if ("error" in validated) {
        setError(validated.error);
        setStatus("error");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Log in to upload files");
        setStatus("error");
        return;
      }

      const filePath = `${user.id}/${crypto.randomUUID()}.${validated.ext}`;
      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { contentType: validated.contentType });
      if (uploadError) {
        setError(uploadError.message);
        setStatus("error");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("resources")
        .getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    }

    formData.set("file_url", fileUrl);
    formData.set("subject_tag", subject);
    formData.set("type_tag", type);
    formData.set("year_tag", year);

    const result = isEditing
      ? await updateResource(resource.id, formData)
      : await createResource(formData);
    if (!result.success) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setStatus("success");
    router.push("/resources");
  }

  return (
    <div className="flex flex-col px-md md:px-10 xl:px-45 py-10 gap-gutter bg-surface-container-low">
      <div className="flex flex-row gap-sm items-center">
        <Link href={"/resources"}>
          <h1 className={`text-on-surface-variant text-headline-md uppercase`}>
            Resources
          </h1>
        </Link>
        <ChevronRight />
        <h1 className={`text-primary text-headline-md uppercase`}>
          {isEditing ? "edit" : "upload"}
        </h1>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-margin">
        <div className="flex flex-col bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant lg:basis-4/5 gap-lg">
          <h1 className="text-primary font-serif text-display-lg font-bold">
            {isEditing ? "Edit Your Resource" : "Share your Knowledge"}
          </h1>
          <h1 className="text-on-surface-variant text-body-md mb-5">
            Contribute to the IB community with high-quality resources. All
            submissions will be reviewed for academic integrity.
          </h1>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Resource Title
              </label>
              <input
                name="title"
                required
                defaultValue={resource?.title}
                className="w-full border-1 border-outline-variant rounded-lg px-3 py-4"
                placeholder="e.g., Analysis and Approaches HL Calculus Summary"
              />
            </div>

            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={resource?.description ?? ""}
                className="w-full border-1 border-outline-variant rounded-lg px-3 py-4"
                placeholder="Provide a brief overview of the content and how it helped you..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                  Subject Tag
                </label>
                <SortDropdown
                  selected={subject}
                  handleClick={handleClickS}
                  options={optionsSubject}
                  placeholder="Select Subject"
                />
              </div>
              <div className="mb-7">
                <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                  Resource Type
                </label>
                <SortDropdown
                  selected={type}
                  handleClick={handleClickT}
                  options={optionsType}
                  placeholder="Select Type"
                />
              </div>
              <div>
                <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                  Year
                </label>
                <SortDropdown
                  selected={year}
                  handleClick={handleClickY}
                  options={optionsYear}
                  placeholder="Select Year"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                {isExternalLink ? "Resource Link" : "File Upload"}
              </label>
              {isExternalLink ? (
                <div className="flex flex-row items-center gap-sm border-1 border-outline-variant rounded-lg px-3 py-4">
                  <Link2 className="text-on-surface-variant shrink-0" size={20} />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                    className="w-full outline-none"
                    placeholder="https://example.com/helpful-resource"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-sm text-center rounded-lg border-2 border-dashed px-3 py-10 cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-surface-container"
                      : "border-outline-variant hover:border-primary"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <>
                      <FileText className="text-primary" size={32} />
                      <p className="text-body-md font-semibold text-on-surface">
                        {file.name}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="flex items-center gap-xs text-sm text-red-500 hover:underline cursor-pointer"
                      >
                        <X size={14} /> Remove
                      </button>
                    </>
                  ) : existingFileUrl ? (
                    <>
                      <FileText className="text-primary" size={32} />
                      <p className="text-body-md font-semibold text-on-surface">
                        {decodeURIComponent(
                          existingFileUrl.split("?")[0].split("/").pop() ||
                            "Current file",
                        )}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        Click to replace, or remove it
                      </p>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="flex items-center gap-xs text-sm text-red-500 hover:underline cursor-pointer"
                      >
                        <X size={14} /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <UploadCloud
                        className="text-on-surface-variant"
                        size={32}
                      />
                      <p className="text-body-md text-on-surface">
                        <span className="text-primary font-semibold">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        PDF, DOC, DOCX, PNG, or JPG
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {status === "success" && (
              <p className="text-sm text-green-600">
                {isEditing
                  ? "Resource updated successfully!"
                  : "Resource uploaded successfully!"}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "uploading"}
              className="bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer px-lg py-sm disabled:opacity-50 inline-flex items-center gap-sm"
            >
              {status === "uploading" && <Spinner size={16} />}
              {status === "uploading"
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Post Resource"}
            </button>
          </form>
        </div>
        <div className="lg:basis-1/3 flex flex-col gap-margin">
          <div className="w-full bg-surface-container-lowest p-lg  border-1 border-outline-variant rounded-xl flex flex-col gap-lg">
            <div className="flex flex-row gap-sm items-center">
              <Verified fill="#002c98" className="text-on-primary" size={40} />
              <h1 className="text-primary font-bold uppercase text-headline-md">
                Upload Guidelines
              </h1>
            </div>
            <div className="flex flex-row items-center gap-sm">
              <div className="flex flex-col gap-sm">
                <div className="flex flex-row gap-sm items-center">
                  <ShieldCheck className="text-primary" />
                  <h1 className="font-semibold text-body-md">
                    Academic Integrity
                  </h1>
                </div>
                <h1 className="text-label-lg text-on-surface-variant pl-8 mb-5">
                  Do not upload copyrighted materials, official IB exam papers,
                  or work that is not yours.
                </h1>
                <div className="flex flex-col gap-sm">
                  <div className="flex flex-row gap-sm items-center">
                    <Hd className="text-primary" />
                    <h1 className="font-semibold text-body-md">File Quality</h1>
                  </div>
                  <h1 className="text-label-lg text-on-surface-variant pl-8 mb-5">
                    Do not upload copyrighted materials, official IB exam
                    papers, or work that is not yours.
                  </h1>
                </div>
                <div className="flex flex-col gap-sm">
                  <div className="flex flex-row gap-sm items-center">
                    <Hd className="text-primary" />
                    <h1 className="font-semibold text-body-md">
                      Original Work
                    </h1>
                  </div>
                  <h1 className="text-label-lg text-on-surface-variant pl-8 mb-5">
                    Contributions should be your own summaries, notes, diagrams,
                    helpful study aids...
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
