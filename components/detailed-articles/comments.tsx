"use client"
import { User } from "lucide-react"
import Button from "../button"
import Comment from "./comment"
import { useState } from "react"

export default function Comments() {
    const [shown, setShown] = useState(3)
   const comments = [1, 2,3,4,5,6]
   const filtered = comments.slice(0, shown)
    return (<div className="mt-25 flex flex-col gap-gutter">

        <div className="flex flex-row items-center gap-md">
            <h1 className="text-headline-lg font-serif font-bold"> Scholarly Conversation</h1>
            <div className="border-1 border-outline-variant px-sm rounded-xl uppercase text-on-surface-variant">12 comments</div>
        </div>

        <div className="p-lg bg-surface-container-low w-full border-1 border-outline-variant flex flex-col">
            <div className="flex flex-row gap-gutter">
                <User size={45} className="bg-surface-container-high p-sm border-1 border-outline-variant text-primary rounded-xl"/>
                <form className="w-full">
                    <textarea className="h-30 w-full bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-md mb-5" placeholder="Add to the Discussion ..."/>
                    <div className="mr-0 ml-auto float-right">
                    <Button>Post Perspective</Button>
                    </div>
                </form>
            </div>
        </div>

        <div className="flex flex-col gap-10 mt-20">
        {filtered.map((i) => (<div key={i} className="w-full"><Comment/></div>))}
        </div>

        <button onClick={()=>setShown(shown+3)} className="text-primary font-bold border-1 border-outline-variant h-15 w-68 rounded-xl self-center hover:bg-surface-container-low cursor-pointer">
            Load additional perspectives
        </button>
    </div>)
} 