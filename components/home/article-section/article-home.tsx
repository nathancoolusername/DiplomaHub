import Panel from "./article-panel"
import { article } from "@/app/page"

type Props = {
  data: article[]
}

export default function ArticleHome({ data }: Props) {

    return (<div className="grid grid-cols-3 gap-gutter w-full">
        {data.map((row) => (
            <div key={row.id}>
            <Panel article={row}/>
            </div>
        ))}
    </div>)
}