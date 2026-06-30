

export default function Pill({ children, className = '', diff}: { children: string, className?: string, diff: string }) {
    return (<span className={`${className} transition font-bold uppercase cursor-pointer`} key={diff}>
                {children}
            </span>)
}