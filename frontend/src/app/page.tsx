import DeliveryInfo from "./components/delivery-info";
import HeroHome from "./components/hero";
import HowItWorks from "./components/how-it-works";
import ScrollTextBar from "./components/scrollbar/scrolltext";
import SubscriptionPlans from "./subscriptions/components/subscription-plans";



export default function Home() {
  return (
    
    <div className=" w-full mx-auto ">
   
   <HeroHome />
    <ScrollTextBar />
      <HowItWorks />
      <SubscriptionPlans />
      <DeliveryInfo />
        </div>


 
  );
}
