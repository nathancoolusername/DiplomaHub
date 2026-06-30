type Pills = {
    [key: string]: string
}

const pills:Pills = {
    "EE" : "bg-primary",
    "IA" : "bg-tertiary",
    "Courses": "bg-secondary",
    "Exam" : "bg-primary",
    "Student Life":"bg-secondary"
}

export default function PanelPill({category} : {category:string}) {
    return (<span className={`${pills[category]} text-on-primary rounded-full px-md py-xs text-label-sm font-bold uppercase absolute top-2 left-2 z-10`}>
                {category}
            </span>)
}