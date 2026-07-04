import { Check, WandSparkles, Clock, Medal, Podium, BadgeCheck } from "lucide-react"

export default function Roadmap() {

    return (
        <div className="flex flex-col px-[60px] py-margin bg-surface-container-low gap-gutter">
            <div className="pb-20 border-b-1 border-outline-variant flex flex-col gap-gutter">
            <h1 className="text-display-lg font-serif text-primary font-bold">Our Direction</h1>
            <h1 className="text-on-surface-variant text-body-lg w-170">
Transparency and shared purpose drive IBPeople. Explore our public roadmap to see how we are evolving the platform for the international community.        </h1>
            </div>

            <div className="flex flex-row gap-margin">
                <div className="w-90 flex flex-col gap-margin">
                    <div className="flex flex-col bg-surface-container-lowest border-1 border-outline-variant p-lg rounded-xl gap-5">
                        <h1 className="font-serif text-headline-md font-bold border-b-1 border-outline-variant pb-5">Milestone Keys</h1>
                        <div className="flex flex-row gap-sm items-center">
                            <Check size={30} className="p-1 bg-secondary rounded-xl text-on-primary"/>
                            <h1 className="text-body-lg text-on-surface-variant">Completed</h1>
                        </div>
                        <div className="flex flex-row gap-sm items-center">
                            <WandSparkles  size={30} className="p-1 bg-primary rounded-xl text-on-primary"/>
                            <h1 className="text-body-lg text-on-surface-variant">In Progress</h1>
                        </div>
                        <div className="flex flex-row gap-sm items-center">
                            <Clock  size={30} className="p-1 bg-surface-container-low rounded-xl text-on-surface-variant"/>
                            <h1 className="text-body-lg text-on-surface-variant">Planned</h1>
                        </div>
                    </div>
                    <div className="flex flex-col bg-primary p-lg rounded-xl gap-5">
                        <h1 className="font-serif text-on-primary text-headline-lg">Help us shape the future</h1>
                        <h1 className="text-on-primary text-body-lg">IBPeople is built by the community. Share your ideas for new features or tools you'd love to see.</h1>
                        <button className="py-sm px-lg bg-surface-container-lowest text-primary rounded-xl text-body-lg cursor-pointer hover:border-primary">Submit Feedback</button>
                    </div>
                </div>
                <div className="flex flex-row gap-margin grow">
                    <div className="flex flex-col gap-[300px]">
                        <Check size={30} className="p-1 bg-secondary rounded-xl text-on-primary"/>
                        <WandSparkles  size={30} className="p-1 bg-primary rounded-xl text-on-primary mb-12"/>
                        <Clock  size={30} className="p-1 bg-inverse-on-surface rounded-xl text-on-surface-variant"/>
                    </div>
                <div className="w-0 border-l-5 border-outline-variant border-dotted h-240 "/>
                    <div className="flex flex-col gap-margin grow">

                        <div className="flex flex-col w-full bg-surface-container-lowest p-lg rounded-xl border-1 border-outline-variant gap-md  hover:border-primary hover:drop-shadow-xl/10 transition">
                            <div className="justify-between flex flex-row items-center ">
                            <h1 className="text-headline-md text-secondary uppercase rounded-xl">Released Sept 2026</h1>
                            <Medal size={30} className="text-secondary ml-auto"/>
                            </div>
                            <h1 className="text-headline-lg font-serif font-bold">IB Pro Status & Gamification</h1>
                            <h1 className="text-on-surface-container text-body-lg">Developed a robust reputation system where users earn "Scholarly Cred" for likes, views, or downloads on their comments, discussions, or resources</h1>
                            <div className="gap-md flex flex-row items-center">
                            <div className="rounded-xl p-md bg-secondary-container flex flex-row gap-sm items-center"><h1 className="text-secondary text-body-lg">IB Pro badges</h1>
                            <Medal size={30} className="text-secondary"/></div>
                            <div className="rounded-xl p-md bg-secondary-container flex flex-row gap-sm items-center"><h1 className="text-secondary text-body-lg">XP Leaderboards</h1>
                            <Podium size={30} className="text-secondary"/></div>
                            </div>
                        </div>

                        <div className="flex flex-col w-full bg-surface-container-lowest p-lg rounded-xl border-1 border-outline-variant gap-gutter border-l-5 border-l-primary hover:border-primary hover:drop-shadow-xl/10 transition">
                            <div className="justify-between flex flex-row items-center">
                            <h1 className="text-headline-md text-primary uppercase rounded-xl">Active development</h1>
                            <Medal size={30} className="text-primary ml-auto"/>
                            </div>
                            <h1 className="text-headline-lg font-serif font-bold">IB News</h1>
                            <h1 className="text-on-surface-container text-body-lg">Launching the integrated news portal sourcing official updates from the IB organization.</h1>

                            <div className="flex flex-col gap-sm">
                                <div className="flex flex-row justify-between text-body-lg">
                                <h1 className="font-bold">Project Completion</h1>
                                <h1 className="text-primary font-bold">20%</h1>
                                </div>
                                <div className="bg-surface-container-low h-3 rounded-xl">
                                    <div className="w-2/10 h-full rounded-l-xl bg-primary"/>
                                </div>
                            </div>

                            <div className="gap-md flex flex-row items-center">
                            <div className="rounded-xl p-md bg-surface-container-low flex flex-row gap-sm items-center"><h1 className="text-primary text-body-lg">Verifed Sources</h1>
                            <BadgeCheck size={30} className="text-primary"/></div>
                            <div className="rounded-xl p-md bg-surface-container-low flex flex-row gap-sm items-center"><h1 className="text-primary text-body-lg">Quickly Updated</h1>
                            <Clock size={30} className="text-primary"/></div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col w-full bg-inverse-on-surface p-lg rounded-xl border-1 border-outline-variant gap-md hover:bg-surface-container-lowest hover:drop-shadow-xl/10 transition">
                            <div className="justify-between flex flex-row items-center">
                            <h1 className="text-headline-md text-on-surface-variant uppercase rounded-xl">Estimated Jan 2027</h1>
                            <Medal size={30} className="text-on-surface-variant ml-auto"/>
                            </div>
                            <h1 className="text-headline-lg font-serif text-on-surface-variant font-bold">University Section</h1>
                            <h1 className="text-on-surface-variant text-body-lg">Brand new page for university resources, discussions and much more, tailored to IB students around the world.</h1>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}