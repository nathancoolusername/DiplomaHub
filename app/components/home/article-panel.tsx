import { Calendar, Dot, Heart, Eye, MoveRight } from "lucide-react"

export default function Panel() {
    
    return (<div className="group flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden cursor-pointer h-130 hover:border-primary hover:drop-shadow-xl/25 transition duration-200">
        <div className="overflow-hidden relative">
            <div style={{backgroundImage: 'url(place-holder.webp)'}} className="w-full h-48 bg-cover transition-transform duration-300 group-hover:scale-110">
            </div>
            <span className="bg-primary text-on-primary rounded-full px-md py-xs text-label-sm font-bold uppercase absolute top-2 left-2 z-10">
                EE
            </span>
        </div>
        <div className="p-md flex flex-col justify-between flex-1">
            <div className="gap-md mx-md flex flex-col">
                <div className="flex flex-row gap-md">
                    <Calendar />
                    <h1 className="text-on-surface-variant">Jun 67, 2067</h1>
                    <Dot/>
                    <h1 className="text-primary font-bold">Mr. Money Man</h1>
                </div>
                <div>
                    <h1 className="text-headline-md font-serif font-bold transition duration-200 group-hover:text-primary">Mastering the Extended Essay</h1>
                </div>
                <div><h1 className="text-on-surface-variant text-body-lg">Uncover the strategic framework for selecting a research question that guarantees high marks while maintaining</h1></div>
            </div>
            <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row">
                <div className="flex flex-row items-center">
                    <Heart />
                    <h1 className="text-on-surface-variant text-body-lg ml-sm mr-md">67</h1>
                    <Eye />
                    <h1 className="text-on-surface-variant text-body-lg ml-sm">67</h1>
                </div>
                <div className="ml-auto text-primary">
                    <MoveRight/>
                </div>
            </div>
        </div>
</div>)
}