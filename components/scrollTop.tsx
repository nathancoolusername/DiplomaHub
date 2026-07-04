"use client"
import { CircleChevronUp } from "lucide-react"

export default function ScrollTopBtn() {
      function scrollToTop() {
    window.scroll({top:0, left:0, behavior :"smooth"});
  }
    return (<button onClick={()=>scrollToTop()} className="bottom-10 sticky cursor-pointer ml-auto mr-10"><CircleChevronUp size={50}/></button>)
}