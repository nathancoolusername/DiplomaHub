"use client"

import Panel from "./article-panel"
import { article } from "@/app/page"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  data: article[]
}

export default function ArticleHome({ data }: Props) {
    const [num, setNum]= useState(1)
    const currentItems = data.slice((+num - 1) * 3, +num * 3)
    return (
        <div className='bg-surface-container-lowest h-[800px] flex flex-col px-lg place-content-center'>
      <div className='mb-lg flex flex-row justify-between'>
        <div>
        <h1 className='text-headline-lg font-serif font-bold'>Featured Articles</h1>
        <h1 className="text-on-surface-variant text-body-lg">Handpicked expertise from the IB community's top contributors.</h1>
        </div>
        <div className='flex flex-row gap-sm'>
          <button onClick={()=>{
                if (num == 1) {
                    return
                } else {
                    setNum(num - 1)
                }
            }}><div className='p-sm rounded-xl border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronLeft/></div></button>
          <button onClick={()=>{ if (num * 3 < data.length) {setNum(num +1)}}}><div className='p-sm rounded-xl border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronRight /></div></button>
        </div>
      </div><div className="grid grid-cols-3 gap-gutter w-full">
        {currentItems.map((row) => (
            <div key={row.id}>
            <Panel article={row}/>
            </div>
        ))}
    </div>
    </div>)
}