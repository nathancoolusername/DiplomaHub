import { Upload } from "lucide-react"
import Button from "../../components/button"
import ResourceGrid from "@/components/resources/resources-grid"
import {SEED_RESOURCES, Resource} from "@/components/data"

export default function Resources() {
const data : Resource[] = SEED_RESOURCES
return (<div className="flex flex-col bg-surface-bright px-margin py-lg gap-margin">

    <div className="flex flex-row justify-between py-margin">
        <div>
            <h1 className="text-display-lg font-serif font-bold">Resources Vault</h1>
            <h1 className="text-on-surface-variant text-body-lg w-170">
                Practical IB materials, exemplars, revision guides, and much more curated for the rigorous academic journey.
            </h1>
        </div>
        <Button className="h-12 self-center text-body-lg">
            <div className="flex flex-row items-center gap-sm text-label-md font-sans">
                <Upload />
                Upload Resource
            </div>
        </Button>
    </div>

    <ResourceGrid data={data}/>


</div>)
}