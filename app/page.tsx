import { GraduationCap, ChevronRight, ChevronLeft } from 'lucide-react';
import ArticleHome from '../components/home/article-section/article-home';
import Trending from '../components/home/trending';
import Image from 'next/image';
import Link from 'next/link';
import {articles} from '@/components/data';
import { discussions } from '@/components/data';


 export type article = {
    "id":number,
    "title":string,
    "description":string,
    "content":string,
    "author_id":number,
    "author":string,
    "topic":string,
    "view_count":number,
    "like_count":number,
    "created_at":Date,
    "published":boolean,
    "slug":string,
    "picture-url":string
  }


export default function Home() {
  const data : article[] = articles
  return (
   <div className="flex flex-col">


    <div className="bg-surface-container-low h-[700px] flex flex-col items-center justify-content-center place-content-center">
      <div className='text-primary bg-surface-container-lowest p-sm flex flex-row gap-sm'>
        <GraduationCap />
        <h1 className='text-body-lg text-primary'>AN ACADEMIC RESOURCE FOR THE IB COMMUNITY</h1>
      </div>
      <div className="text-center">
        <h1 className="text-display-lg font-serif font-bold m-md">
          Your Journey Through the IB,
        </h1>
        <h1 className="text-display-lg font-serif font-bold m-md text-primary italic">
          Simplified Together
        </h1>
        <h1 className="text-on-surface-variant text-body-lg w-170">
          The dedicated community platform for IB students, alumni, and educators. Collaborate, share resources, and navigate the IB journey with calm competence.
        </h1>
        <div className='mt-lg'>
          <Link href={"/community"}>
          <button className="bg-primary text-on-primary px-lg py-md rounded-lg text-body-lg hover:opacity-90 transition-opacity cursor-pointer">
              <div className='flex flex-row items-center'>
                <h1 className='pr-sm'>Explore community</h1>
              </div>
            </button>
            </Link>
            <Link href={"/resources"}>
            <button className="ml-sm border-primary border-1 bg-surface-container-lowest text-primary px-lg py-md rounded-lg text-body-lg hover:bg-surface-container-high transition cursor-pointer">
              <div className='flex flex-row items-center'>
                <h1 className='pr-sm'>Explore Resources</h1>
              </div>
            </button>
            </Link>
        </div>
      </div>
    </div>



      <ArticleHome data={data}/>

    <Trending discussions={discussions}/>

    <div className='h-[400px] bg-primary py-lg px-md place-content-center'>
      <div className='bg-primary-container flex flex-row rounded-xl justify-between py-lg px-lg'>
        <div className='flex flex-col py-lg px-lg gap-gutter'>
          <h1 className='text-headline-lg text-on-primary font-serif font-bold'>Want to see more IBPeople Content?</h1>
          <h1 className='text-body-lg text-surface-container-high'>Get funny, interesting, and engaging videos delivered straight from the founders on Instagram.</h1>
        </div>
        <Image
        src={"/insta-logo.png"}
        alt={"instagram logo"}
        height={100}
        width={200}
        className='cursor-pointer'
        />
      </div>
    </div>
   </div>
  );
}
