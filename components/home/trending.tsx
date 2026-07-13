import Item from "./trending-item"
import { MoveUpRight } from "lucide-react"
import type { Discussion } from "@/app/lib/types";
import Link from "next/link";

export default function Trending({discussions} : {discussions:Discussion[]}) {
  let i=0;
  const shown = [...discussions]
    .sort((a, b) => b.like_count - a.like_count)
    .slice(0, 3)
    return ( <div className='bg-surface-container-low min-h-fit lg:h-[700px] flex flex-col lg:flex-row justify-content-center px-lg py-lg lg:pt-[150px] lg:pb-[100px] gap-gutter'>
      <div className='flex flex-col lg:basis-3/8 px-md gap-lg'>
        <div className='bg-primary text-on-primary px-sm py-sm rounded text-label-md w-30'><h1>Now Trending</h1></div>
        <div><h1 className='text-headline-lg font-serif font-bold'>Community Pulse</h1></div>
        <div>
          <h1 className="text-on-surface-variant text-body-lg">What the IB community is talking about right now. Real-time updates on discussions, resource drops, and exam prep.</h1>
        </div>
        <div className="flex flex-row gap-sm flex-wrap">
          {shown.map((discussion)=> {
            return (<span key={discussion.id} className="cursor-pointer bg-surface-container-lowest text-on-surface-variant rounded-full px-md py-xs text-label-sm font-bold uppercase border-1 border-outline-variant hover:bg-primary hover:text-on-primary transition">
                #{discussion.subject_tag}
          </span>)
          })}
        </div>
      </div>
      <div className='lg:basis-5/8 flex flex-col gap-gutter'>
      {shown.map((discussion)=> {
        i++;
        if (i<=3) {
        return (
          <div key={i}>
          <Link href={`/community/${discussion.id}`}><Item discussion={discussion} num={i}/></Link>
          </div>
        )}
      })}
       <Link href={"/community"}><div className="flex flex-row mt- gap-sm cursor-pointer hover:border-b-1 border-primary transition w-67"><h1 className="text-primary font-bold">View all trending discussions</h1> <MoveUpRight /> </div></Link> 
      </div>
    </div>)
}