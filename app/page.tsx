import { MoveRight, ChevronRight, ChevronLeft } from 'lucide-react';
import ArticleHome from './components/home/article-home';
import Trending from './components/home/trending';
import Image from 'next/image';

export default function Home() {
  return (
   <div className="flex flex-col">


    <div className="bg-surface-container-low h-[700px] flex flex-col items-center justify-content-center place-content-center">
      <div className="text-center">
        <h1 className="text-display-lg font-serif font-bold m-md">
          By IBPeople, For IBPeople
        </h1>
        <h1 className="text-on-surface-variant text-body-lg w-170">
          The dedicated community platform for IB students, alumni, and educators. Collaborate, share resources, and navigate the IB journey with calm competence.
        </h1>
        <div className='mt-lg'>
          <button className="bg-primary text-on-primary px-lg py-md rounded-lg text-body-lg hover:opacity-90 transition-opacity cursor-pointer">
              <div className='flex flex-row items-center'>
                <h1 className='pr-sm'>Explore community</h1>
                <MoveRight/>
              </div>
            </button>
            <button className="ml-sm border-primary border-1 bg-surface-container-lowest text-primary px-lg py-md rounded-lg text-body-lg hover:bg-surface-container-high transition cursor-pointer">
              <div className='flex flex-row items-center'>
                <h1 className='pr-sm'>Contribute Article</h1>
              </div>
            </button>
        </div>
      </div>
    </div>


    <div className='bg-surface-container-lowest h-[800px] flex flex-col px-lg place-content-center'>
      <div className='mb-lg flex flex-row justify-between'>
        <div>
        <h1 className='text-headline-lg font-serif font-bold'>Featured Articles</h1>
        <h1 className="text-on-surface-variant text-body-lg">Handpicked expertise from the IB community's top contributors.</h1>
        </div>
        <div className='flex flex-row gap-sm'>
          <div className='p-sm rounded-xl border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronLeft/></div>
          <div className='p-sm rounded-xl border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer'><ChevronRight /></div>
        </div>
      </div>
      <ArticleHome/>
    </div>

    <Trending/>

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
