import HeroHome from "./components/hero";
import ScrollTextBar from "./components/scrollbar/scrolltext";
import Prenumerationer from "./subscriptions/page";


export default function Home() {
  return (
    
    <div className=" w-full mx-auto ">
   
   <HeroHome />
   <ScrollTextBar />
    <Prenumerationer />
  
        </div>


 
  );
}
