import HeroHome from "./components/hero";
import ScrollTextBar from "./components/scrollbar/scrolltext";
import SubscriptionPlans from "./subscriptions/components/subscription-plans";


export default function Home() {
  return (
    
    <div className=" w-full mx-auto ">
   
   <HeroHome />
    <ScrollTextBar />
      <SubscriptionPlans />
        </div>


 
  );
}
