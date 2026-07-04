import { Pencil } from "lucide-react"
import Button from "../../components/button"
import ArticleGrid from "../../components/articles/article-grid"
import {SEED_ARTICLES, Article} from "@/components/data"

export default function Articles() {
const data : Article[] = SEED_ARTICLES
return (<div className="flex flex-col bg-surface-bright px-margin py-lg gap-margin">

    <div className="flex flex-row justify-between py-margin">
        <div>
            <h1 className="text-display-lg font-serif font-bold">Article Archive</h1>
            <h1 className="text-on-surface-variant text-body-lg w-170">
                A curated collection of articles, guides, and student experiences from across the IB community.
            </h1>
        </div>
        <Button className="h-12 self-center text-body-lg">
            <div className="flex flex-row items-center gap-sm text-label-md font-sans">
                <Pencil/>
                Write Article
            </div>
        </Button>
    </div>

    <ArticleGrid data={data}/>


</div>)
}