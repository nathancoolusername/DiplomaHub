import { TrendingUp } from "lucide-react"
import type { Discussion } from "@/app/lib/types"

export default function Item({discussion, num}:{discussion:Discussion, num:number}) {
    return (<div className="group bg-surface-container-lowest rounded py-md px-lg flex-1 flex flex-row  items-center justify-content-center cursor-pointer hover:border-primary hover:drop-shadow-xl/10 transition hover:border-1 gap-gutter justify-between">
        <div className="flex flex-row gap-gutter flex-1 min-w-0">
            <span className="font-serif text-surface-dim text-display-lg group-hover:text-primary transition">0{num}</span>
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex flex-row gap-sm items-center justify-content-center">
                    <p className="text-primary font-bold text-label-md">{discussion.type_tag}</p>
                </div>
                <h3 className="text-headline-md font-bold group-hover:text-primary transition font-serif break-words">{discussion.title}</h3>
            </div>
        </div>
        <TrendingUp size={32} className="ml-md shrink-0 group-hover:text-primary"/>
    </div>)
}