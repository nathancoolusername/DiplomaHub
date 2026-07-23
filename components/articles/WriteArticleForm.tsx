"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  ChangeEvent,
  DragEvent,
  FormEvent,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  CircleCheck,
  ImageIcon,
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  LinkIcon,
  Quote,
  X,
} from "lucide-react";
import { createArticle, updateArticle } from "@/app/lib/actions/articles";
import { uploadArticleCoverImage } from "@/app/lib/actions/upload";
import SortDropdown from "@/components/articles/drop-down";
import { SubjectTags } from "@/components/pills";
import { Spinner } from "@/components/spinner";
import { Breadcrumb } from "@/components/Breadcrumb";

type SubmitStatus = "idle" | "saving" | "error";

type EditableArticle = {
  id: string;
  title: string;
  content: string;
  topic: string | null;
  cover_image_url: string | null;
};

const topicOptions = Object.keys(SubjectTags);

function toolbarBtnClass(active?: boolean) {
  return `p-sm rounded cursor-pointer ${active ? "bg-primary text-on-primary" : "hover:bg-surface-container-high"}`;
}

export default function WriteArticleForm({
  article,
}: {
  article?: EditableArticle;
}) {
  const isEditing = !!article;
  const [topic, setTopic] = useState(article?.topic ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(
    article?.cover_image_url ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const router = useRouter();

  const coverInputRef = useRef<HTMLInputElement>(null);

  const newCoverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : null),
    [coverImage],
  );
  const coverPreview = newCoverPreview ?? existingCoverUrl;

  useEffect(() => {
    return () => {
      if (newCoverPreview) URL.revokeObjectURL(newCoverPreview);
    };
  }, [newCoverPreview]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        strike: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: "Start writing your article here...",
      }),
    ],
    content: article?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "article-editor min-h-100 px-3 py-4 text-body-lg text-on-surface focus:outline-none",
      },
    },
  });

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setCoverImage(e.target.files[0]);
  }

  function handleCoverDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setCoverImage(e.dataTransfer.files[0]);
  }

  function clearCover(e: React.MouseEvent) {
    e.stopPropagation();
    setCoverImage(null);
    setExistingCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function setLink() {
    const url = window.prompt("Enter a URL");
    if (!url || !editor) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    const title = (formData.get("title") as string)?.trim();
    if (!title) {
      setError("Title is required");
      setStatus("error");
      return;
    }
    if (!topic) {
      setError("Please select a category");
      setStatus("error");
      return;
    }
    if (!editor || editor.isEmpty) {
      setError("Content is required");
      setStatus("error");
      return;
    }

    setStatus("saving");
    const html = editor.getHTML();

    let coverImageUrl = existingCoverUrl ?? "";
    if (coverImage) {
      const uploadResult = await uploadArticleCoverImage(coverImage);
      if (!uploadResult.success) {
        setError(uploadResult.error);
        setStatus("error");
        return;
      }
      coverImageUrl = uploadResult.data.coverImageUrl;
    }

    formData.set("topic", topic);
    formData.set("content", html);
    formData.set("cover_image_url", coverImageUrl);
    formData.set(
      "published",
      formData.get("intent") === "publish" ? "true" : "false",
    );

    const result = isEditing
      ? await updateArticle(article.id, formData)
      : await createArticle(formData);

    if (!result.success) {
      setError(result.error);
      setStatus("error");
      return;
    }

    router.push("/articles");
  }

  // A plain function passed to <form action={fn}> runs inside a React
  // transition, which can skip painting intermediate states (like the
  // "saving" spinner) entirely if the whole submit resolves quickly —
  // onSubmit + preventDefault uses a normal event handler instead, so
  // setStatus("saving") is guaranteed to flush before the network calls.
  // FormData's second arg preserves which button (Save Draft vs Publish)
  // triggered the submit, same as native form submission would.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as
      | HTMLElement
      | undefined;
    handleSubmit(new FormData(e.currentTarget, submitter));
  }

  return (
    <div className="flex flex-col px-md md:px-10 xl:px-45 py-10 gap-gutter bg-surface-container-low">
      <Breadcrumb
        parentLabel="Articles"
        parentHref="/articles"
        currentLabel={isEditing ? "edit" : "write"}
      />
      <div className="flex-1 flex flex-col lg:flex-row gap-margin">
        <div className="flex flex-col bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant lg:basis-4/5 gap-lg">
          <h1 className="text-primary font-serif text-display-lg font-bold">
            {isEditing ? "Continue Your Draft" : "Share Your Expertise"}
          </h1>
          <p className="text-on-surface-variant text-body-md mb-5">
            Contribute to the IB community with well-researched insights and
            practical advice.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Article Title
              </label>
              <input
                name="title"
                required
                defaultValue={article?.title}
                className="w-full border-1 border-outline-variant rounded-lg px-3 py-4 font-serif text-headline-md"
                placeholder="How to Write a Standout IB Extended Essay"
              />
            </div>

            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Category
              </label>
              <SortDropdown
                selected={topic}
                handleClick={setTopic}
                options={topicOptions}
                placeholder="Select Category"
              />
            </div>

            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Cover Image
              </label>
              <div
                onClick={() => coverInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleCoverDrop}
                className={`relative flex flex-col items-center justify-center gap-sm text-center rounded-lg border-2 border-dashed px-3 py-10 cursor-pointer transition-colors overflow-hidden ${
                  isDragging
                    ? "border-primary bg-surface-container"
                    : "border-outline-variant hover:border-primary"
                }`}
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                {coverPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="max-h-60 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearCover}
                      className="flex items-center gap-xs text-sm text-red-500 hover:underline cursor-pointer"
                    >
                      <X size={14} /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="text-on-surface-variant" size={32} />
                    <p className="text-body-md text-on-surface">
                      Click to upload cover image
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      High resolution landscape images work best (16:9)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-body-md text-on-surface-variant mb-1 font-semibold">
                Content
              </label>
              <div className="border-1 border-outline-variant rounded-lg overflow-hidden">
                <div className="flex flex-row gap-xs items-center border-b-1 border-outline-variant bg-surface-container px-sm py-xs">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={toolbarBtnClass(editor?.isActive("bold"))}
                    aria-label="Bold"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={toolbarBtnClass(editor?.isActive("italic"))}
                    aria-label="Italic"
                  >
                    <Italic size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={toolbarBtnClass(
                      editor?.isActive("heading", { level: 2 }),
                    )}
                    aria-label="Section heading"
                  >
                    <Heading2 size={16} />
                  </button>
                  <div className="w-px h-5 bg-outline-variant mx-xs" />
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                    className={toolbarBtnClass(editor?.isActive("bulletList"))}
                    aria-label="Bullet list"
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleOrderedList().run()
                    }
                    className={toolbarBtnClass(editor?.isActive("orderedList"))}
                    aria-label="Numbered list"
                  >
                    <ListOrdered size={16} />
                  </button>
                  <div className="w-px h-5 bg-outline-variant mx-xs" />
                  <button
                    type="button"
                    onClick={setLink}
                    className={toolbarBtnClass(editor?.isActive("link"))}
                    aria-label="Link"
                  >
                    <LinkIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleBlockquote().run()
                    }
                    className={toolbarBtnClass(editor?.isActive("blockquote"))}
                    aria-label="Callout / quote"
                  >
                    <Quote size={16} />
                  </button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex flex-row gap-sm justify-end">
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={status === "saving"}
                className="bg-surface-variant-lowest text-primary border-1 border-primary rounded-lg px-lg py-sm hover:bg-surface-container transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-sm"
              >
                {status === "saving" && <Spinner size={16} />}
                {status === "saving" ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={status === "saving"}
                className="bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer px-lg py-sm disabled:opacity-50 inline-flex items-center gap-sm"
              >
                {status === "saving" && <Spinner size={16} />}
                {status === "saving" ? "Publishing..." : "Publish"}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:basis-1/3 flex flex-col gap-margin">
          <div className="w-full bg-surface-container-lowest p-md border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h2 className="font-serif text-headline-lg font-bold text-primary">
              Submission Guidelines
            </h2>
            <div className="flex flex-row gap-sm">
              <CircleCheck className="text-primary shrink-0" size={22} />
              <div className="flex flex-col">
                <h3 className="text-body-md font-bold">Academic Honesty</h3>
                <p className="text-label-md text-on-surface-variant">
                  Ensure all work is original and respects IB academic
                  integrity standards.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-sm">
              <CircleCheck className="text-primary shrink-0" size={22} />
              <div className="flex flex-col">
                <h3 className="text-body-md font-bold">Cite Your Sources</h3>
                <p className="text-label-md text-on-surface-variant">
                  Use standard citation formats for any external research or
                  data mentioned.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-sm">
              <CircleCheck className="text-primary shrink-0" size={22} />
              <div className="flex flex-col">
                <h3 className="text-body-md font-bold">Clarity & Tone</h3>
                <p className="text-label-md text-on-surface-variant">
                  Maintain a professional, scholarly, and supportive tone for
                  fellow students.
                </p>
              </div>
            </div>
            <p className="text-label-md text-on-surface-variant border-t-1 border-outline-variant pt-md">
              Draft articles are only visible to you. Publishing makes an
              article visible to the whole community immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
