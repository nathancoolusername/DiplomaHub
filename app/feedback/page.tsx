"use client";

import { useState, type FormEvent } from "react";
import { submitFeedback } from "@/app/lib/actions/feedback";

export default function FeedbackPage() {
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    setError(null);

    const result = await submitFeedback(content);
    if (result.success) {
      setSubmitted(true);
      setContent("");
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center py-20 px-md bg-surface-container-low min-h-full">
      <div className="bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-margin w-full max-w-150 flex flex-col gap-margin">
        <h1 className="text-display-lg font-serif font-bold">
          Submit Feedback
        </h1>
        <h1 className="text-on-surface-variant text-body-lg">
          Got a bug report, feature request, or something you&apos;d love to
          see on DiplomaHub? Let us know below.
        </h1>

        {submitted ? (
          <div className="bg-secondary-container text-secondary rounded-xl p-lg text-body-lg font-semibold">
            Thanks — your feedback has been submitted!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Tell us what's on your mind..."
              className="h-40 w-full border rounded-lg px-md py-sm text-body-lg"
            />
            {error && <p className="text-red-500 text-body-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-on-primary rounded-lg py-sm font-semibold cursor-pointer hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
