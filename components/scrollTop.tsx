"use client"
import { usePathname } from "next/navigation"
import { CircleChevronUp } from "lucide-react"
import { useBroPlacement } from "./shared/bro/bro-visibility"

// Pages with their own fixed bottom bar (the set player and marking step)
// would have this button sitting on top of their actions.
const HIDDEN_ON = [/^\/practice\/sets\/[^/]+\/play$/, /^\/practice\/attempts\/[^/]+$/]

export default function ScrollTopBtn() {
  const pathname = usePathname()
  // The Bro button takes this corner on pages that have it.
  const { broMounted } = useBroPlacement()
  if (broMounted || HIDDEN_ON.some((re) => re.test(pathname))) return null
      function scrollToTop() {
    window.scroll({top:0, left:0, behavior :"smooth"});
  }
    return (<button onClick={()=>scrollToTop()} className="bottom-10 sticky cursor-pointer ml-auto mr-10"><CircleChevronUp size={50}/></button>)
}
