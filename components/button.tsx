

export default function Button({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <button className={`bg-primary text-on-primary px-lg py-sm rounded-lg hover:opacity-90 transition-opacity cursor-pointer ${className}`}>
              {children}
            </button>
    )
}