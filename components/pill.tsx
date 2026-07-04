

export default function Pill({ children, className = ''}: { children: string, className?: string}) {
    return (<span className={`${className} transition font-bold uppercase cursor-pointer`}>
                {children}
            </span>)
}