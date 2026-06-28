import Panel from "./article-panel"

export default function ArticleHome() {

    return (<div className="grid grid-cols-3 gap-gutter w-full">
        <Panel/>
        <Panel/>
        <Panel/>
    </div>)
}