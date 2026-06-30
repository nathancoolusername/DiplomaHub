"use client"
import Pill from "../pill"
import { useState } from "react"
import SortDropdown from "./drop-down"
import Panel from "./article-panel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { article } from "@/app/page"

type Props = {
  data: article[]
}
type TopicKey = "All" | "EE" | "IA" | "Course" | "Exam" | "Student Life"


const pills: Record<TopicKey, { label: string; bg: string; bgContainer: string; text: string; textContainer: string }> = {
    "All" : { label: 'All', bg: 'bg-primary', bgContainer: 'bg-primary-container', text: 'text-on-primary', textContainer: 'bg-surface-container' },
   "EE" : {label:"EE", bg: 'bg-secondary', bgContainer: 'bg-secondary-container', text: 'text-on-secondary', textContainer: 'text-on-secondary-container'},
    "IA":{label:"IA", bg: 'bg-tertiary', bgContainer: 'bg-tertiary-container', text: 'text-on-tertiary', textContainer: 'text-on-tertiary-container'},
    "Course" : {label:"Course", bg: 'bg-primary', bgContainer: 'bg-primary-container', text: 'text-on-primary', textContainer: 'bg-surface-container'},
    "Exam" : {label:"Exam", bg: 'bg-secondary', bgContainer: 'bg-secondary-container', text: 'text-on-secondary', textContainer: 'text-on-secondary-container'},
    "Student Life" : {label:"Student Life",bg: 'bg-tertiary', bgContainer: 'bg-tertiary-container', text: 'text-on-tertiary', textContainer: 'text-on-tertiary-container'},
}


export default function ArticleGrid({ data }: Props) {
    const [active, setActive] = useState("All")
    const [num, setNum] = useState("1")
    const buttons = [];
    for (let i = 1; i < 13; i++) {
        const isActive = +num === i
        if (i < 4) {buttons.push(<button onClick={() => {setNum(`${i}`)}} className={`border-1 border-outline-variant h-10 w-9 items-center rounded  cursor-pointer ${isActive ? `bg-primary text-on-primary` : `hover:bg-surface-container-high transition`}`} key={i}>{i}</button>);} else if (i == 4) 
            {buttons.push(<h1 key={i}>...</h1>)} else if (i===12) {buttons.push(<button onClick={() => {setNum(`${i}`)}} className={`border-1 border-outline-variant h-10 w-9 items-center rounded  cursor-pointer ${isActive ? `bg-primary text-on-primary` : `hover:bg-surface-container-high transition`}`} key={i}>{i}</button>)}
        }

    return( <div className="flex flex-col gap-gutter">

        <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-sm">{Object.keys(pills).map((pill) => {
                const isActive = active === pill;
                return (<button onClick={() => {setActive(pill)}} key={pill}><Pill className={`px-md py-sm rounded-xl text-label-md ${isActive ? `${pills[pill as TopicKey].bg} ${pills[pill as TopicKey].text}` : `${pills[pill as TopicKey].bgContainer} ${pills[pill as TopicKey].textContainer}`}`} diff={pill}>{pill}</Pill></button>)
            })}</div>
            <div className="flex flex-row gap-sm items-center">
                <h1 className="text-on-surface-variant">Sort by:</h1>
                <div>
                    <SortDropdown/>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-gutter">
            {data.map((article) => {
                return (<div key={article.id}><Panel article = {article}><Pill className={`px-md py-sm rounded-xl text-label-md ${pills[article.topic as TopicKey].bg} ${pills[article.topic as TopicKey].text} absolute top-2 left-2 z-10`} diff={article.topic}>{article.topic}</Pill></Panel></div>)
            })}
        </div>

        <div className="flex flex-row gap-sm items-center justify-content-center place-content-center">
            <div className='p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronLeft/></div>
            {
                buttons.map((button) => button)
            }
            <div className='p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronRight/></div>
        </div>

    </div>)
}