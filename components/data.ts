import { DOMAttributes } from "react";

const SidArticle = `
<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Writing an extended essay in IB Physics can be one of the most rewarding parts of the DP, however it is notorious for being difficult. Unlike the regular lab reports you do in class, the Physics EE requires students to work like an actual physicist. Whether you are drowning in data or just trying to choose a topic, here are 6 helpful tips to help you achieve that elusive A.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">1. Choose a topic you actually are interested in</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The EE writing process takes a long time, so avoid choosing a topic simply due to it sounding impressive. Instead, choose a question that actually interests you. Whether it is resonance in a guitar, airflow in cycling, or efficiency in solar panels, curiosity plays a colossal role in motivating you when experiments become repetitive and processing and analysing data gets tedious.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">A good research question should also be focused. For example, "How does renewable energy work?" is too broad. "How does the angle of incidence affect the efficiency of a photovoltaic panel?" is more specific and manageable.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">2. Make sure your physics is IB level</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Your extended essay needs to have physics that matches or even exceeds the IB Physics syllabus. If the extended essay is too standard and only uses SUVAT equations for example, it will not reach the higher markbands for critical thinking and personal engagement.</p>

<ul class="list-disc list-inside font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4 space-y-2 pl-4">
  <li><span class="font-semibold text-on-surface">Level Up:</span> Look for topics where you can introduce slightly advanced concepts, like fluid dynamics or rotational mechanics.</li>
  <li><span class="font-semibold text-on-surface">Keep the essay balanced:</span> Don't go so far into university-level quantum mechanics that you don't actually understand what you are writing down; you must be able to explain every single derivation clearly.</li>
</ul>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">3. Prioritize a strong methodology for the experiment</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">If the experiment you are doing is sophisticated, that does not mean that it will lead to a better EE. Matter of fact, simple experiments that are conducted carefully often reach higher markbands than ambitious and overly sophisticated experiments which yield unreliable data.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">In your methodology, clearly identify the independent, dependent, and controlled variables. Additionally, it should be clear that the measurements are repeated multiple times and which sources of error are present and how to minimize them. Demonstrating strong scientific knowledge is just as important as getting 'perfect' results.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">4. Master the analysis of your errors and the uncertainties</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">When writing a physics extended essay, your data is only as good as your analysis of the uncertainties. If you plug a bunch of raw data into a table without error bars, your data analysis marks will plummet.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">In the data processing, include everything. You need explicit absolute, percentage, and fractional uncertainties for all the raw data. Additionally, your final graphs should include clear error bars, a trendline of best fit, and possibly and preferably a maximum and minimum trendline, and the worst acceptable fit. Use the gradient of these lines to calculate the final uncertainty in your experimental value.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">5. Start data analysis early</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">What many students do is they spend months collecting data and only start analysing it when the deadline is near. This is highly risky. Analyse data as soon as possible to confirm whether your method actually produces meaningful and understandable results.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Calculate uncertainties, graph trends, and evaluate whether the chosen model fits the data. Completing the analysis early allows you to adjust your methodology before it becomes too late.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">6. Do not just describe, critically evaluate</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The discussion and the evaluation sections are where the standard essays have the chance to turn into excellent ones or really poor ones. Do not just state, "The value of g was found to be 9.5 ms⁻²"; that is just a description.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Instead ask yourself "why?". Why is the value different from the theoretical value of 9.81 ms⁻²? Was it a systematic error such as friction, or a random error like reaction time.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface-variant px-6 py-4 italic bg-surface-container border-l-4 border-primary rounded-lg mb-4">Additionally, it is important to be very specific in the description. Instead of saying the inaccuracies were caused by a human error, say "a 0.5 second delay in manual stopwatch operation introduced a 3% random uncertainty in the time intervals."</p>
`
const AdarshArticle = `
<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">When I first began my IB Physics Extended Essay, I thought the hardest part would be understanding the physics. I investigated whether a simplified Jensen Wake Superposition Model could accurately predict power deficits in multi row wind farms. The project included wind turbine wakes, velocity deficits, power calculations, and comparisons with data from the Horns Rev I offshore wind farm in Denmark.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">However, with me, the hardest problem I ran into was learning how to conduct scientific research and not the actual physics behind it!</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Starting with a Simple Question</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Students believe an Extended Essay must begin with a groundbreaking idea. But actually, most successful research often starts with a simple question.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">I was interested in renewable energy and wind turbines. While reading about wind farms, I discovered that turbines reduce wind speeds behind them, creating what are known as wakes. These wakes can lower the energy production of downstream turbines.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">That observation led to a question:</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface-variant px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4">"To what extent can a simplified Jensen wake superposition model predict the power deficit experienced by downstream wind turbines in multi-row wind farm layouts?"</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">I chose this question with the help of my Extended Essay supervisor that was focused, measurable, and allowed me to apply physics to an engineering problem.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">The Importance of Research Notes</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">One of the most valuable habits I developed was taking detailed notes while researching.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">I first thought I would read journal articles and assumed I would remember the important information later. I quickly discovered that after reading several papers, it became difficult to recall where specific ideas, equations, and data originated. So I created organized notes to solve this problem.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">For every source, I recorded:</p>

<ul class="list-disc list-inside font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4 space-y-2 pl-4">
  <li>Key concepts</li>
  <li>Important equations</li>
  <li>Useful figures and data</li>
  <li>Citation information</li>
  <li>Questions that arose while reading</li>
</ul>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">And these notes later became the foundation for my background theory and evaluation sections. Without them, writing the essay would have taken much longer.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Breaking the Essay into Sections</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Looking at a 4,000 word essay can feel intimidating. Instead of thinking about the entire document, I divided it into smaller sections just to help myself.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">My EE was structured into:</p>

<ul class="list-disc list-inside font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4 space-y-2 pl-4">
  <li>Introduction</li>
  <li>Background Theory</li>
  <li>Methodology</li>
  <li>Results</li>
  <li>Analysis</li>
  <li>Evaluation</li>
  <li>Conclusion</li>
</ul>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">By focusing on one section at a time the process becomes way more manageable.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">For example, while writing the background theory, I concentrated only on making the examiner understand what I was talking about. When writing the evaluation, I focused solely on the limitations of the model and the analysis.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">This really prevented the project from feeling overwhelming and allowed me to make steady progress.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Learning That Models Are Never Perfect</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">One of the most interesting discoveries came when comparing my model's predictions to actual wind turbine data from the wind farm Horns Rev I.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">My calculations successfully predicted the trend of turbines further downstream producing less power because they experienced more wake interactions.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">However, my model overestimated wake losses by roughly 20%. I thought this meant something was wrong with my calculations. But after further research, I realized the value was actually one of the most important findings of the entire investigation.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The simplified model assumed a lot of things which did not hold true in real life, as real wind farms are much more complex. So, I learned that understanding the limitations of a model is often just as important as obtaining accurate predictions.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Avoiding Repetition</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Another lesson I learned was the importance of avoiding repetition because in scientific writing, every section should serve a unique purpose.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Whenever I found myself repeating the same explanation in multiple sections, I either removed it or expanded it with new insights. This made the essay clearer and more concise.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Why Evaluation Matters</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Before beginning the EE, I assumed the results section would be the most important part. But I quickly found that evaluation was where much of the critical thinking occurred.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The strongest part of my essay was the discussion of why the model differed from reality. This transformed my project into a genuine scientific investigation.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Advice for Future EE Students</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">If I could give one piece of advice to future Extended Essay students, it would be this:</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Don't wait until the end to start writing. Take notes from the beginning. Try to organize your research, divide the essay into sections and write small portions regularly rather than attempting everything at once.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">But most importantly, do not worry if your results are imperfect.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">In science, understanding why a model succeeds or fails is often usually more valuable than obtaining a perfect answer. My investigation showed that a simplified wake model could predict general trends in wind farm power deficits while still overestimating actual losses. That limitation became one of the most important conclusions of the essay. The Extended Essay is an opportunity to think like a scientist by evaluating evidence critically, and learning how real research is conducted. These are skills that can be carried into any area of life!</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Good luck with your EE!</p>
`

const MathEEArticle = `
<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The IB Mathematics Extended Essay is one of the most intellectually demanding yet rewarding pieces of work you will produce in the Diploma Programme. Unlike other subjects, a Maths EE gives you the freedom to explore a topic purely through the lens of mathematical reasoning. However, that freedom can also be its biggest challenge. Here is how to make sure your essay stands out.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">1. Pick a question with real mathematical depth</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The most common mistake students make is choosing a topic that sounds mathematical but ends up being mostly descriptive. A question like "What is the history of the Fibonacci sequence?" will not score well because it leaves little room for original analysis.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">A strong Maths EE question should allow you to derive, prove, model, or analyse something. For example, "How does step size affect the accuracy of Euler's Method when approximating solutions to logistic differential equations?" gives you a concrete mathematical object to investigate with clear variables and measurable outcomes.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface-variant px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4 italic">A good rule of thumb: if your research question could be answered without writing a single equation, it is probably not mathematical enough.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">2. Stay within mathematics you can actually explain</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">It is tempting to reach for impressive-sounding university mathematics. Topology, abstract algebra, and measure theory all sound compelling. But if you cannot explain every step of your own working clearly and confidently, the examiner will notice.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The best essays sit just above the IB syllabus level. They take familiar tools — calculus, differential equations, linear algebra, number theory — and apply them in a focused, rigorous way. Depth of understanding always scores better than breadth of terminology.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">3. Structure your argument like a proof</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">A Mathematics EE is not a report — it is a mathematical argument. Every section should build logically on the last. Introduce definitions and background theory early, then develop your analysis step by step so the reader is never left wondering where a result came from.</p>

<ul class="list-disc list-inside font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4 space-y-2 pl-4">
  <li>Define all notation and variables before using them</li>
  <li>Justify every non-trivial step in your working</li>
  <li>Separate background theory from your own original analysis clearly</li>
  <li>Use numbered equations so you can reference them later</li>
</ul>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The introduction should tell the reader exactly what you are investigating and why it is mathematically interesting. The conclusion should directly answer your research question based on what you derived or discovered.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">4. Use technology as a tool, not a crutch</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Graphing calculators, Python, MATLAB, and GeoGebra are all legitimate tools in a Maths EE. Generating graphs, running numerical simulations, or verifying analytical results computationally can genuinely strengthen your investigation.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">However, technology should support your mathematics, not replace it. If your entire analysis consists of plugging values into software and describing the output, you are missing the point. Always show the analytical reasoning behind what the software confirms.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">5. Treat your limitations as findings</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Many students dread the evaluation section because they feel their results were not good enough. In mathematics, this thinking misses the point entirely. If your model breaks down under certain conditions, that breakdown is a result worth analysing.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Ask yourself: why does the method fail here? Is it a fundamental limitation of the approach, or a consequence of an assumption you made early on? What would a more sophisticated model look like? These questions demonstrate exactly the kind of critical mathematical thinking that earns marks in the higher bands.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface-variant px-6 py-4 bg-surface-container border-l-4 border-primary rounded-lg mb-4 italic">A model that works perfectly and a model that fails in an interesting way are equally valuable — as long as you can explain why.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">6. Write for a mathematically literate reader</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Your target reader is someone with a strong mathematics background who has not seen your specific investigation before. You do not need to explain what a derivative is, but you do need to explain why you are taking a specific derivative at a specific point and what it tells you in the context of your question.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Avoid two extremes: do not over-explain basic concepts, and do not skip steps because they feel obvious to you. The goal is a clean, logical narrative where every line of mathematics serves the argument.</p>

<h2 class="font-serif text-headline-md leading-[2rem] text-primary mt-10 mb-4">Final Thoughts</h2>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The Maths EE rewards students who are genuinely curious about a problem and willing to sit with it long enough to understand it deeply. Choose a question you find interesting, build your argument carefully, and do not be afraid of results that surprise you.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">The best extended essays are not the ones with the most advanced mathematics — they are the ones where the writer clearly understood every line they wrote and had something interesting to say about it.</p>

<p class="font-sans text-body-lg leading-[1.75rem] text-on-surface mb-4">Good luck with your EE!</p>
`
// types/index.ts

export type SubjectTag =
  | "Math AA"
  | "Math AI"
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "English"
  | "History"
  | "Economics"
  | "Geography"
  | "TOK"
  | "EE"
  | "General"
  | "Other";

export type ResourceTypeTag =
  | "Template"
  | "Guide"
  | "Subject Notes"
  | "Past Paper Tips"
  | "External Link"
  | "Other";

export type DiscussionTypeTag =
  | "Discussion"
  | "Question"
  | "Resource"
  | "EE/IA Help"
  | "Rant/Vent";

export type YearTag = "Pre-IB" | "DP1" | "DP2" | "Alumni" | "General";

export type FileType = "PDF" | "DOCX" | "PPTX" | "XLSX" | "Link" | "Other";

export interface Author {
  name: string;
  is_pro: boolean;
  initials: string;
  title:string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  subject_tag: SubjectTag;
  type_tag: ResourceTypeTag;
  year_tag: YearTag;
  file_url: string;
  file_type: FileType;
  author: Author;
  download_count: number;
  like_count: number;
  created_at:  Date;
  published?: boolean;
}

export interface TopReply {
  content: string;
  author: string;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  subject_tag: SubjectTag;
  type_tag: DiscussionTypeTag;
  year_tag: YearTag;
  author: Author;
  reply_count: number;
  like_count: number;
  top_reply: TopReply;
  created_at:  Date;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  subject_tag: SubjectTag;
  author: Author;
  view_count: number;
  like_count: number;
  read_time: number; // minutes
  created_at: Date;
  published?: boolean;
}

export interface Contributor {
  rank: number;
  name: string;
  initials: string;
  xp: number;
  is_pro: boolean;
}

// Filter state shape — useful for your filter components
export interface ResourceFilters {
  subject: SubjectTag | "All";
  type: ResourceTypeTag | "All";
  year: YearTag | "All";
  sort: "Most Downloaded" | "Newest" | "Most Liked";
}

export interface DiscussionFilters {
  subject: SubjectTag | "All";
  type: DiscussionTypeTag | "All";
  year: YearTag | "All";
  sort: "Newest" | "Hot";
}

// lib/seed-data.ts

export const SEED_RESOURCES: Resource[] = [
  {
    id: "1",
    title: "EE Structure Template (All Subjects)",
    description: "A complete Extended Essay structure with section breakdowns, word count targets per section, and examiner notes on what each part should achieve.",
    subject_tag: "EE",
    type_tag: "Template",
    year_tag: "DP2",
    file_url: "/seed/ee-structure-template.pdf",
    author: { name: "Nathan K.", is_pro: true, initials: "NK", title:"IB Student" },
    download_count: 847,
    like_count: 203,
    created_at:  new Date("2026-06-12"),
    file_type: "PDF",
  },
  {
    id: "2",
    title: "Math AA HL Paper 3 Techniques",
    description: "Breakdown of every Paper 3 topic that has appeared since 2021. Includes worked examples and the exact phrasing examiners use for each technique.",
    subject_tag: "Math AA",
    type_tag: "Guide",
    year_tag: "DP2",
    file_url: "/seed/math-aa-p3.pdf",
    author: { name: "Yuki S.", is_pro: true, initials: "YS", title:"IB Educator"  },
    download_count: 1204,
    like_count: 341,
    created_at:  new Date("2026-06-18"),
    file_type: "PDF",
  },
  {
    id: "3",
    title: "Physics IA Rubric Breakdown",
    description: "Line-by-line breakdown of the Physics IA markscheme. Shows exactly what examiners look for in Personal Engagement, Exploration, Analysis, and Evaluation.",
    subject_tag: "Physics",
    type_tag: "Guide",
    year_tag: "DP1",
    file_url: "/seed/physics-ia-rubric.pdf",
    author: { name: "Liam G.", is_pro: true, initials: "LG", title:"Almuni"  },
    download_count: 692,
    like_count: 178,
    created_at:  new Date("2026-06-20"),
    file_type: "PDF",
  },
  {
    id: "4",
    title: "History IA Citation Matrix",
    description: "A spreadsheet template for tracking sources across your History IA. Columns for source type, origin, purpose, value, and limitation — maps directly to OPVL.",
    subject_tag: "History",
    type_tag: "Template",
    year_tag: "DP1",
    file_url: "/seed/history-ia-citations.xlsx",
    author: { name: "Elena R.", is_pro: false, initials: "ER", title:"IB Educator"  },
    download_count: 423,
    like_count: 97,
    created_at:  new Date("2026-06-25"),
    file_type: "XLSX",
  },
  {
    id: "5",
    title: "TOK Exhibition Object Planning Sheet",
    description: "One-page planning sheet per object. Prompts you to justify object choice, link to the IA prompt, and pre-empt examiner questions about real-world context.",
    subject_tag: "TOK",
    type_tag: "Template",
    year_tag: "DP1",
    file_url: "/seed/tok-exhibition-planner.pdf",
    author: { name: "Sofia M.", is_pro: false, initials: "SM", title:"Alumni"  },
    download_count: 318,
    like_count: 84,
    created_at:  new Date("2026-06-28"),
    file_type: "PDF",
  },
  {
    id: "6",
    title: "IB Command Terms Cheat Sheet",
    description: "Every IB command term across all subjects with plain-English definitions and example exam sentences. Laminate-ready A4 layout.",
    subject_tag: "General",
    type_tag: "Guide",
    year_tag: "General",
    file_url: "/seed/command-terms.pdf",
    author: { name: "Nathan K.", is_pro: true, initials: "NK", title:"IB Student"  },
    download_count: 2103,
    like_count: 589,
    created_at:  new Date("2026-05-30"),
    file_type: "PDF",
  },
];

export const SEED_DISCUSSIONS:Discussion[] = [
  {
    id: "1",
    title: "How are you guys structuring your Physics IA evaluation section?",
    content: "I've collected my data for the refractive index experiment, but I'm struggling to distinguish between systematic and random errors in the conclusion.",
    subject_tag: "Physics",
    type_tag: "Question",
    year_tag: "DP2",
    author: { name: "Alex Thompson", is_pro: true, initials: "AT", title:"IB Student"  },
    reply_count: 32,
    like_count: 124,
    top_reply: {
      content: "Make sure to explicitly mention how each error affects your final gradient...",
      author: "Maya S.",
    },
    created_at:  new Date("2026-07-01T17:57:00Z"),
  },
  {
    id: "2",
    title: "Sample EE Structure for History (Category 2)",
    content: "I just uploaded my final draft structure to the resource folder. It focuses on Cold War dynamics. Feel free to use the citation matrix I built!",
    subject_tag: "History",
    type_tag: "Resource",
    year_tag: "DP2",
    author: { name: "Elena Rodriguez", is_pro: false, initials: "ER", title:"IB Student"  },
    reply_count: 89,
    like_count: 542,
    top_reply: {
      content: "This citation matrix is a lifesaver, thank you Elena!",
      author: "James W.",
    },
    created_at:  new Date("2026-07-01T14:30:00Z"),
  },
  {
    id: "3",
    title: "Math AA HL Paper 3 predictions for May 2027 — what topics are you expecting?",
    content: "Based on the past 3 years there's a clear rotation between statistics, calculus, and proof. I think complex numbers are overdue.",
    subject_tag: "Math AA",
    type_tag: "Discussion",
    year_tag: "DP2",
    author: { name: "Yuki S.", is_pro: true, initials: "YS", title:"IB Educator"  },
    reply_count: 156,
    like_count: 398,
    top_reply: {
      content: "Agreed on complex numbers. The 2025 paper skipped it entirely which is unusual.",
      author: "Priya N.",
    },
    created_at:  new Date("2026-06-30T09:15:00Z"),
  },
  {
    id: "4",
    title: "Is anyone else finding TOK essays impossible this year?",
    content: "The prescribed titles feel deliberately vague. Title 3 especially — what does 'productive' even mean in the context of knowledge?",
    subject_tag: "TOK",
    type_tag: "Discussion",
    year_tag: "DP2",
    author: { name: "Chloe B.", is_pro: false, initials: "CB", title:"IB Student"  },
    reply_count: 47,
    like_count: 211,
    top_reply: {
content: "Productive = generates more questions than it answers. That's literally the whole point of TOK.",
      author: "Daniel K.",
    },
    created_at:  new Date("2026-06-29T21:44:00Z"),
  },
  {
    id: "5",
    title: "Chemistry IA — is colorimetry a safe topic or too overdone?",
    content: "My teacher said colorimetry gets marked harder because examiners have seen it a thousand times. But the method is clean and I have access to the equipment.",
    subject_tag: "Chemistry",
    type_tag: "Question",
    year_tag: "DP1",
    author: { name: "Reza M.", is_pro: false, initials: "RM", title:"Alumni"  },
    reply_count: 28,
    like_count: 76,
    top_reply: {
      content: "It's fine if your analysis goes beyond Beer-Lambert. Most students stop too early.",
      author: "Yuki S.",
    },
    created_at:  new Date("2026-06-28T16:20:00Z"),
  },
  {
    id: "6",
    title: "University application thread — Canadian CS programs 2027 entry",
    content: "Waterloo, UofT, UBC, McGill. Let's share predicted grades, extracurriculars, and what we're hearing back. Waterloo AIF tips especially welcome.",
    subject_tag: "General",
    type_tag: "Discussion",
    year_tag: "DP2",
    author: { name: "Nathan K.", is_pro: true, initials: "NK", title:"IB Student"  },
    reply_count: 73,
    like_count: 187,
    top_reply: {
      content: "For Waterloo AIF, specificity beats volume. One deep project beats five shallow ones.",
      author: "Liam G.",
    },
    created_at:  new Date("2026-06-27T11:05:00Z"),
  },
];

export const SEED_ARTICLES :Article[]= [
  {
    id: "1",
    title: "How I Went From a Predicted 4 to a Final 7 in Math AA HL",
    slug: "predicted-4-to-final-7-math-aa-hl",
    excerpt: "In November of DP1 I was averaging 58% on past papers. By May exams I scored a 7. Here's exactly what changed — and what I wish I'd done earlier.",
    subject_tag: "Math AA",
    author: { name: "Yuki S.", is_pro: true, initials: "YS", title:"IB Educator"  },
    view_count: 3420,
    like_count: 412,
    read_time: 8,
    created_at:  new Date("2026-06-10"),
  },
  {
    id: "2",
    title: "The EE Mistake 80% of Students Make in Their First Draft",
    slug: "ee-mistake-first-draft",
    excerpt: "Your research question is probably too broad. Here's how to diagnose it, fix it, and reframe your entire argument in under a week.",
    subject_tag: "EE",
    author: { name: "Nathan K.", is_pro: true, initials: "NK", title:"IB Student"  },
    view_count: 2891,
    like_count: 334,
    read_time: 6,
    created_at:  new Date("2026-06-15"),
  },
  {
    id: "3",
    title: "Physics IA: Why Your Evaluation Section is Losing You Marks",
    slug: "physics-ia-evaluation-marks",
    excerpt: "Most students describe errors. Examiners want you to quantify and link them. The difference is worth 3–4 marks and most students never make the switch.",
    subject_tag: "Physics",
    author: { name: "Liam G.", is_pro: true, initials: "LG", title:"Alumni"  },
    view_count: 1756,
    like_count: 198,
    read_time: 5,
    created_at:  new Date("2026-06-22"),
  },
  {
    id: "4",
    title: "Applying to Waterloo CS as an IB Student — What Actually Matters",
    slug: "waterloo-cs-ib-student-guide",
    excerpt: "The AIF is worth more than most people think. Here's how to structure your responses, what Waterloo is actually looking for, and how IB grades translate.",
    subject_tag: "General",
    author: { name: "Nathan K.", is_pro: true, initials: "NK", title:"IB Student"  },
    view_count: 2104,
    like_count: 287,
    read_time: 10,
    created_at:  new Date("2026-06-25"),
  },
];

export const SEED_TOP_CONTRIBUTORS = [
  { rank: 1, name: "Yuki S.", initials: "YS", xp: 2450, is_pro: true },
  { rank: 2, name: "Liam G.", initials: "LG", xp: 2120, is_pro: true },
  { rank: 3, name: "Sofia M.", initials: "SM", xp: 1890, is_pro: false },
  { rank: 4, name: "Nathan K.", initials: "NK", xp: 1740, is_pro: true },
  { rank: 5, name: "Elena R.", initials: "ER", xp: 1320, is_pro: false },
];
