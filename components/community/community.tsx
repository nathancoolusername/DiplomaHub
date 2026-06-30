"use client"

import FilterDropdown from "./drop-down";
import { useState } from "react";
import { TrendingUp, Dot, SquarePen } from "lucide-react";
import { Discussion } from "@/app/community/page";
import Panel from "./discussion-panel";

const optionsSubject = ["All Subjects", "Mathematics AA", "Physics", "Chemistry", "Economics", "English A lit", "Enligsh A Lang & Lit", "CAS"];
const opttionsType = ["All Types", "Discussion", "Question", "Resource"];
const optionsYear = ["Any Year", "DP1", "DP2", "Pre IB", "Alumni"];
type Props = {
    data: Discussion[]
}

export default function CommunityPage({data}:Props) {
    const [order, setOrder] = useState("Newest");
    let newest = order == "Newest";
    let Hot = order == "Hot";
    return (
        <div className="bg-surface-container-low flex flex-row py-margin px-30">

            <div className="flex flex-col gap-margin basis-2/3">

                <div className="flex-col flex w-full">
                    <h1 className="font-serif text-headline-md">Filter Discussions</h1>
                    <div className="flex flex-row mt-margin gap-margin">
                        <div className="flex flex-col gap-sm basis-1/3">
                            <h1 className="text-on-surface-variant text-body-md">Subject</h1>
                            <FilterDropdown options={optionsSubject}/>
                        </div>
                        <div className="flex flex-col gap-sm basis-1/3">
                            <h1 className="text-on-surface-variant text-body-md">Type</h1>
                            <FilterDropdown options={opttionsType}/>
                        </div>
                        <div className="flex flex-col gap-sm basis-1/3">
                            <h1 className="text-on-surface-variant text-body-md">Year</h1>
                            <FilterDropdown options={optionsYear}/>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex flex-row gap-sm items-center">
                        <TrendingUp className="text-on-primary-fixed-variant"/>
                        <h1 className="font-serif text-headline-md">Trending This Week</h1>
                    </div>
                    <div className="flex flex-row mt-margin gap-lg">
                        <div className="flex flex-col bg-surface-container-high px-md py-lg rounded-xl basis-1/2 gap-sm border-1 border-outline-variant cursor-pointer transition hover:border-on-primary-fixed-variant">
                            <div className="px-sm bg-on-primary-fixed-variant text-on-primary text-label-md font-semibold w-30 rounded-sm justify-center">
                                <h1>MOST ACTIVE</h1>
                            </div>
                            <h1 className="text-headline-md font-serif">Math AA HL Paper 3 Predictions</h1>
                            <div className="flex flex-row gap-sm text-on-surface-variant text-label-md items-center">
                                <h1>2.4k views</h1>
                                <Dot/>
                                <h1>200 replies</h1>
                            </div>
                        </div>
                        <div className="flex flex-col bg-surface-container-high px-md py-lg rounded-xl basis-1/2 gap-sm border-1 border-outline-variant cursor-pointer transition hover:border-secondary">
                            <div className="px-sm bg-secondary text-on-primary text-label-md font-semibold w-23 rounded-sm justify-center">
                                <h1>ESSENTIAL</h1>
                            </div>
                            <h1 className="text-headline-md font-serif">Extended Essay Citation Template</h1>
                            <div className="flex flex-row gap-sm text-on-surface-variant text-label-md items-center">
                                <h1>6.7k views</h1>
                                <Dot/>
                                <h1>200 replies</h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex flex-row justify-between border-b-1 border-outline-variant pb-md">
                        <h1 className="font-serif text-headline-md">All Discussions</h1>
                        <div className="flex flex-row gap-sm">
                            <button onClick={() => setOrder("Newest")}><h1 className={`px-md rounded-3xl py-1 transition cursor-pointer ${newest ? "bg-surface-container-high text-on-primary-fixed-variant font-bold" : "text-on-surface-variant"}`}>Newest</h1></button>
                            <button onClick={() => setOrder("Hot")}><h1 className={`px-md rounded-3xl py-1 transition cursor-pointer ${Hot ? "bg-surface-container-high text-on-primary-fixed-variant font-bold" : "text-on-surface-variant"}`}>Hot</h1></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-margin">
                    {data.map((discussion) => {
                        return (<div key={discussion.id}>
                            <Panel discussion={discussion}/>
                        </div>)
                    })}
                </div>

            </div>

            <div className="basis-1/3 flex flex-col ml-margin gap-margin">
                <div className="h-60 w-full bg-surface-container-lowest place-content-center justify-center items-center p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-lg">
                    <h1 className="font-serif text-headline-md">Your Status</h1>
                    <h1 className="flex text-primary-container p-md bg-surface-container-low font-serif text-headline-md rounded-full items-center justify-center border-surface-container-highest border-1 hover:border-primary cursor-pointer transition">Login to see your status</h1>
                </div>

                <div className="h-60 w-full bg-surface-container-lowest p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
                    <h1 className="font-serif text-headline-md">Have a question?</h1>
                    <h1 className="text-on-surface-variant text-body-lg">Get Help with your IAs, EE, or subject doubts from the community.</h1>
                    <div className="bg-on-primary-fixed-variant w-full h-12 rounded-xl flex flex-row gap-md items-center justify-center mt-sm cursor-pointer hover:drop-shadow-xl/10">
                        <SquarePen size={25} className="text-on-primary"/>
                        <h1 className="text-on-primary font-semibold text-body-lg">Start a Discussion</h1>
                    </div>
                </div>

                <div className="h-60 w-full bg-surface-container-lowest p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
                    <h1 className="font-serif text-headline-md">Top Contributors</h1>
                    <div className="bg-surface-container-low w-full h-24 rounded-xl flex items-center justify-center">
                        <h1 className="font-semibold text-headline-md font-serif text-on-primary-fixed">Coming Soon...</h1>
                    </div>
                </div>
            </div>
        </div>
    )
}