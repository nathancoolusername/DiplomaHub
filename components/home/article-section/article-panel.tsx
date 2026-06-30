import { Calendar, Dot, Heart, Eye, MoveRight } from "lucide-react"
import { article } from "@/app/page"
import PanelPill from "./pill";

type Props = {
  article:article
}
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];



export default function Panel({article}: Props) {
    let month = months[article.created_at.getMonth()];
    let final = month + " " + article.created_at.getDate() + ", " + article.created_at.getFullYear();
    let final_view;
    let final_like;
    if (article.view_count >= 1000) {
    const shortened = article.view_count / 1000
    final_view = `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`
}
    if (article.like_count >= 1000) {
    const shortened = article.like_count / 1000
    final_like = `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`
}
    return (<div className="group flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden cursor-pointer h-130 hover:border-primary hover:drop-shadow-xl/25 transition duration-200">
        <div className="overflow-hidden relative">
            <div style={{backgroundImage: 'url(place-holder.webp)'}} className="w-full h-48 bg-cover transition-transform duration-300 group-hover:scale-110">
            </div>
            <PanelPill category={article.topic}/>
        </div>
        <div className="p-md flex flex-col justify-between flex-1">
            <div className="gap-md mx-md flex flex-col">
                <div className="flex flex-row gap-md">
                    <Calendar />
                    <h1 className="text-on-surface-variant">{final}</h1>
                    <Dot/>
                    <h1 className="text-primary font-bold">{article.author}</h1>
                </div>
                <div>
                    <h1 className="text-headline-md font-serif font-bold transition duration-200 group-hover:text-primary">{article.title}</h1>
                </div>
                <div><h1 className="text-on-surface-variant text-body-sm">{article.description}</h1></div>
            </div>
            <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row">
                <div className="flex flex-row items-center">
                    <Heart />
                    <h1 className="text-on-surface-variant text-body-lg ml-sm mr-md">{final_like}</h1>
                    <Eye />
                    <h1 className="text-on-surface-variant text-body-lg ml-sm">{final_view}</h1>
                </div>
                <div className="ml-auto text-primary">
                    <MoveRight/>
                </div>
            </div>
        </div>
</div>)
}