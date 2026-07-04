import Image from "next/image"
import Link from "next/link"
import { SEED_ARTICLES } from "@/components/data"
import { ChevronRight, CircleUser, Calendar, Bookmark, Heart, Eye, Share2, } from "lucide-react"
import Comments from "@/components/detailed-articles/comments"

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = SEED_ARTICLES.find((a) => +a.id === Number(id));

  if (!article) return <div>Article not found</div>
  let month = months[article.created_at.getMonth()];
  let final = month + " " + article.created_at.getDate() + ", " + article.created_at.getFullYear();
  let final_view;
    let final_like;
    if (article.view_count >= 1000) {
    const shortened = article.view_count / 1000
    final_view = `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`
} else {final_view = article.view_count}
    if (article.like_count >= 1000) {
    const shortened = article.like_count / 1000
    final_like = `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`
} else {
  final_like = article.like_count
}

  return (
    <div className="flex flex-col px-100 py-10  gap-gutter bg-surface-container-lowest">

      <div className="flex flex-row gap-sm items-center">
       <Link href={"/articles"}><h1 className={`text-on-surface-variant text-headline-md uppercase`}>articles</h1></Link>
       <ChevronRight/>
       <h1 className={`text-secondary text-headline-md uppercase`}>{article.subject_tag}</h1>
      </div>

      <h1 className={`font-serif text-display-lg font-bold`}>{article.title}</h1>

      <div className="border-b-1 border-outline-variant flex flex-row pb-md gap-gutter">
          <div className="flex flex-row items-center gap-sm">
              <CircleUser />
                <div className="flex flex-col">
                  <h1 className="text-body-lg">{article.author.name}</h1>
                  <h1 className="text-label-md text-on-surface-variant">IB Educator</h1>
                </div>                
          </div>
          <div className="flex flex-row items-center gap-sm">
            <Calendar/>
            <h1>{final}</h1>
          </div>
        </div>

        <Image
            src={"/option-pics/StudentLife/StudentLife1.jpg"}
            alt={article.title}
            width={500}
            height={500}
            className="w-full h-auto" />

        <div className="pb-10 border-b-1 border-outline-variant">
<h1 className="font-serif text-headline-lg leading-[2.5rem] text-primary mb-6">How to Write a Standout IB Mathematics Extended Essay</h1>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The IB Mathematics Extended Essay is one of the most intellectually demanding yet rewarding pieces of work you will produce in the Diploma Programme. Unlike other subjects, a Maths EE gives you the freedom to explore a topic purely through the lens of mathematical reasoning. However, that freedom can also be its biggest challenge. Here is how to make sure your essay stands out.</p>

<h2 className="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">1. Pick a question with real mathematical depth</h2>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The most common mistake students make is choosing a topic that sounds mathematical but ends up being mostly descriptive. A question like "What is the history of the Fibonacci sequence?" will not score well because it leaves little room for original analysis.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">A strong Maths EE question should allow you to derive, prove, model, or analyse something. For example, "How does step size affect the accuracy of Euler's Method when approximating solutions to logistic differential equations?" gives you a concrete mathematical object to investigate with clear variables and measurable outcomes.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface-variant px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4">A good rule of thumb: if your research question could be answered without writing a single equation, it is probably not mathematical enough.</p>

<h2 className="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">2. Stay within mathematics you can actually explain</h2>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">It is tempting to reach for impressive-sounding university mathematics. Topology, abstract algebra, and measure theory all sound compelling. But if you cannot explain every step of your own working clearly and confidently, the examiner will notice.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The best essays sit just above the IB syllabus level. They take familiar tools — calculus, differential equations, linear algebra, number theory — and apply them in a focused, rigorous way. Depth of understanding always scores better than breadth of terminology.</p>

<h2 className="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">3. Structure your argument like a proof</h2>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">A Mathematics EE is not a report — it is a mathematical argument. Every section should build logically on the last. Introduce definitions and background theory early, then develop your analysis step by step so the reader is never left wondering where a result came from.</p>

<ul className="list-disc list-inside font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4 space-y-2 pl-4">
  <li>Define all notation and variables before using them</li>
  <li>Justify every non-trivial step in your working</li>
  <li>Separate background theory from your own original analysis clearly</li>
  <li>Use numbered equations so you can reference them later</li>
</ul>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The introduction should tell the reader exactly what you are investigating and why it is mathematically interesting. The conclusion should directly answer your research question based on what you derived or discovered.</p>

<h2 className="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">4. Use technology as a tool, not a crutch</h2>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Graphing calculators, Python, MATLAB, and GeoGebra are all legitimate tools in a Maths EE. Generating graphs, running numerical simulations, or verifying analytical results computationally can genuinely strengthen your investigation.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">However, technology should support your mathematics, not replace it. If your entire analysis consists of plugging values into software and describing the output, you are missing the point. Always show the analytical reasoning behind what the software confirms.</p>

<h2 className="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">5. Treat your limitations as findings</h2>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Many students dread the evaluation section because they feel their results were not good enough. In mathematics, this thinking misses the point entirely. If your model breaks down under certain conditions, that breakdown is a result worth analysing.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Ask yourself: why does the method fail here? Is it a fundamental limitation of the approach, or a consequence of an assumption you made early on? What would a more sophisticated model look like? These questions demonstrate exactly the kind of critical mathematical thinking that earns marks in the higher bands.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface-variant px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4">A model that works perfectly and a model that fails in an interesting way are equally valuable — as long as you can explain why.</p>

<h2 className="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">6. Write for a mathematically literate reader</h2>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Your target reader is someone with a strong mathematics background who has not seen your specific investigation before. You do not need to explain what a derivative is, but you do need to explain why you are taking a specific derivative at a specific point and what it tells you in the context of your question.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Avoid two extremes: do not over-explain basic concepts, and do not skip steps because they feel obvious to you. The goal is a clean, logical narrative where every line of mathematics serves the argument.</p>

<h2 className="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Final Thoughts</h2>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The Maths EE rewards students who are genuinely curious about a problem and willing to sit with it long enough to understand it deeply. Choose a question you find interesting, build your argument carefully, and do not be afraid of results that surprise you.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The best extended essays are not the ones with the most advanced mathematics — they are the ones where the writer clearly understood every line they wrote and had something interesting to say about it.</p>

<p className="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Good luck with your EE!</p>
</div>
          <div className=" pt-md flex flex-row">
            <div className="flex flex-row items-center">
                <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl cursor-pointer hover:border-outline-variant border-white border-b-1"><Heart size={30}/></div>
                  <h1 className="text-on-surface-variant text-body-lg ml-sm mr-md">{final_like} likes</h1>
                  <div className="text-on-surface-variant transition hover:text-primary p-sm"><Eye size={30}/></div>
                  <h1 className="text-on-surface-variant text-body-lg ml-sm">{final_view} views</h1>
            </div>
                <div className="ml-auto text-on-surface-variant rounded-xl flex flex-row gap-md items-center">
                <Bookmark size={50} className="rounded-xl text-display-lg transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"/>
                <Share2 size={50} className="rounded-xl transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"/>
                  </div>
          </div>

        <Comments/>

      </div>
  )
}