import { Heart, Eye, CircleUser } from "lucide-react"
import { article } from "@/app/page"


export default function Panel({ children, article }: { children: React.ReactNode; article: article }) {
    
    return (<div key={article.id} className="group flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden cursor-pointer h-130 hover:border-primary hover:drop-shadow-xl/25 transition duration-200">
        <div className="overflow-hidden relative">
            <div style={{backgroundImage: 'url(place-holder.webp)'}} className="w-full h-48 bg-cover transition-transform duration-300 group-hover:scale-110">
            </div>
            {children}
        </div>
        <div className="p-md flex flex-col justify-between flex-1">
            <div className="gap-md mx-md flex flex-col">
                <div className="mt-md">
                    <h1 className="text-headline-md font-serif font-bold transition duration-200 group-hover:text-primary">{article.title}</h1>
                </div>
                <div><h1 className="text-on-surface-variant text-body-sm">{article.description}</h1></div>
            </div>
            <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row">
                <div className="flex flex-row items-center gap-sm">
                    <CircleUser />
                    <div className="flex flex-col">
                        <h1 className="text-body-md">{article.author}</h1>
                        <h1 className="text-label-sm text-on-surface-variant">IB Pro</h1>
                    </div>
                </div>
                <div className="flex flex-row items-center ml-auto text-primary">
                    <Heart />
                    <h1 className="text-on-surface-variant text-body-lg ml-sm mr-md">{article.like_count}</h1>
                    <Eye />
                    <h1 className="text-on-surface-variant text-body-lg ml-sm">{article.view_count}</h1>
                </div>
            </div>
        </div>
</div>)
}