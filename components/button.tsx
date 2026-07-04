

export default function Button({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <button className={`bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex flex-row gap-sm ${className} px-lg py-sm`}>
              {children}
            </button>
    )
}