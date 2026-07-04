import { Dot, TrendingUp } from "lucide-react"
import { Discussion } from "../data"

export default function Item({discussion, num}:{discussion:Discussion, num:number}) {
    return (<div className="group bg-surface-container-lowest rounded py-md px-lg flex-1 flex flex-row  items-center justify-content-center cursor-pointer hover:border-primary hover:drop-shadow-xl/10 transition hover:border-1 gap-gutter justify-between">
        <div className="flex flex-row gap-gutter">
            <h1 className="font-serif text-surface-dim text-display-lg group-hover:text-primary transition">0{num}</h1>
            <div className="flex flex-col">
                <div className="flex flex-row gap-sm items-center justify-content-center">
                    <h1 className="text-primary font-bold text-label-md">{discussion.type_tag}</h1>
                </div>
                <h1 className="text-headline-md font-bold group-hover:text-primary transition font-serif">{discussion.title}</h1>
            </div>
        </div>
        <TrendingUp className="ml-auto mr-15 group-hover:text-primary"/>
    </div>)
}