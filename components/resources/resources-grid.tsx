
"use client"
import { useState } from "react"
import SortDropdown from "../articles/drop-down"
import Panel from "../home/article-section/article-panel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Resource, SubjectTag } from "../data"
import Link from "next/link"
import { SubjectTags, ActiveSubjectTags } from "../pills"


export type FileType = "PDF" | "DOCX" | "PPTX" | "XLSX" | "Link" | "Other";
type Props = {
  data: Resource[]
}
const options = ["Newest", "Oldest", "Most Liked", "Most Downloaded"];
const opttionsType = ["All Types", "Template", "Guide", "Subject Notes", "Past Paper Tips", "External Link", "Other"];
const optionsYear = ["Any Year", "DP1", "DP2", "Pre IB", "Post IB"];


export default function ResourceGrid({ data }: Props) {
    const [type, setType] = useState("All Types")
    const [year, setYear] = useState("Any Year")
    const [selected, setSelected] = useState("Most Downloaded");
    const handleClick = (select:string) => setSelected(select);
    const handleClickT = (select:string) => setType(select);
    const handleClickY = (select:string) => setYear(select);
    const [active, setActive] = useState("All");
    const [num, setNum] = useState("1");
    const buttons = [];
    let filter = data.filter((article) => {
        if (active == "All") {return true} else {
        return (article.subject_tag === active)}
    });
    if (selected == "Newest") {
        filter.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    } else if (selected == "Most Downloaded") {
        filter.sort((a, b) => b.download_count- a.download_count)
    } else if (selected == "Most Liked") {
        filter.sort((a, b) => b.like_count- a.like_count)
    }
        const filterT = filter.filter((resource) => {
            if (type == opttionsType[0]) {return true} else {
            return (resource.type_tag === type)}
        });
        const filterY = filterT.filter((resource) => {
            if (year == optionsYear[0]) {return true} else {
            return (resource.year_tag === year)}
        });
    const currentItems = filterY.slice((+num - 1) * 6, +num * 6)
    let numButtons = Math.ceil(filterY.length / 6) 
    for (let i = 1; i < numButtons+1; i++) {
        const isActive = +num === i
        if (i < 4) {buttons.push(<button onClick={() => {setNum(`${i}`)}} className={`border-1 border-outline-variant h-10 w-9 items-center rounded  cursor-pointer ${isActive ? `bg-primary text-on-primary` : `hover:bg-surface-container-high transition`}`} key={i}>{i}</button>);} else if (i == 4) 
            {buttons.push(<h1 key={i}>...</h1>)} else if (i===12) {buttons.push(<button onClick={() => {setNum(`${i}`)}} className={`border-1 border-outline-variant h-10 w-9 items-center rounded  cursor-pointer ${isActive ? `bg-primary text-on-primary` : `hover:bg-surface-container-high transition`}`} key={i}>{i}</button>)}
        }





    return( <div className="flex flex-col gap-gutter">

        <div className="flex flex-col bg-surface-container-lowest border-1 border-outline-variant p-lg rounded-xl gap-margin">
            <div className="flex flex-col gap-md">
                <h1>Subject Areas</h1>
            <div className="flex flex-row gap-sm flex-wrap">
                <button onClick={() => {setActive("All");
                    setNum("1")
                }} className="cursor-pointer m-1">{active=="All" ? <span className={`px-md py-sm rounded-xl text-label-md bg-primary text-on-primary font-bold uppercase`}>All</span> : <span className={`px-md py-sm rounded-xl text-label-md bg-surface-container text-primary font-bold uppercase`}>All</span>}</button>
                {Object.keys(SubjectTags).map((pill) => {
                const isActive = active === pill;
                return (<button onClick={() => {setActive(pill);
                    setNum("1")
                }} key={pill} className="cursor-pointer my-1">{isActive ? ActiveSubjectTags[pill] : SubjectTags[pill]}</button>)
            })}</div>
            </div>

            <div className="flex flex-row gap-margin w-full">
            <div className="flex flex-col gap-sm basis-1/3">
                <h1 className="text-on-surface-variant">Resource Type</h1>
                <div>
                    <SortDropdown options={opttionsType} selected={type} handleClick={handleClickT}/>
                </div>
            </div>
            <div className="flex flex-col gap-sm basis-1/3">
                <h1 className="text-on-surface-variant">Year</h1>
                <div>
                    <SortDropdown options={optionsYear} selected={year} handleClick={handleClickY}/>
                </div>
            </div>

            <div className="flex flex-col gap-sm basis-1/3">
                <h1 className="text-on-surface-variant">Sort by</h1>
                <div>
                    <SortDropdown options={options} selected={selected} handleClick={handleClick}/>
                </div>
            </div>
            <button className="self-end cursor-pointer" onClick={() => {setType(opttionsType[0]); setYear(optionsYear[0])}}>
                        <div className="bg-on-primary-fixed-variant items-center flex justify-center h-10 w-20 self-end rounded-xl  hover:drop-shadow-xl/10">
                            <h1 className="text-on-primary text-body-md">Clear</h1>
                        </div>
                        </button>
            </div>

        </div>

        <div className="grid grid-cols-3 gap-gutter">
            {currentItems.map((resource) => {
                if (active == "All") {
                return (<div key={resource.id}>
                    <Panel resource = {resource}/>
                    </div>)}
                else if (active == resource.subject_tag) {return (<div key={resource.id}>
                    <Panel resource = {resource}/>
                    </div>)}
            })}
        </div>
        <div className="flex flex-row gap-sm items-center justify-content-center place-content-center">
            <button onClick={()=>{
                if (+num !== 1){
                    setNum(`${+num - 1}`)
                }
            }}><div className='p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronLeft/></div></button>
            {
                buttons.map((button) => button)
            }
            <button onClick={()=>{
                if (+num < numButtons) {
                    setNum(`${+num + 1}`)
                }
            }}><div className='p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronRight/></div></button>
        </div> 
    </div>)
}