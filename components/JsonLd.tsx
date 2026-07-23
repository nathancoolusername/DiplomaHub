// Structured data (schema.org) for search engines — renders as a <script>
// tag per Next's documented JSON-LD pattern. The data we pass in often
// includes user-submitted content (resource/article/discussion titles,
// content), so escape `<` before injecting — otherwise a title like
// "</script><script>..." could break out of the JSON-LD block and execute.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
