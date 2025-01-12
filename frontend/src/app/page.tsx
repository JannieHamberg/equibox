
import HowItWorks from "./components/how-it-works";

import DeliveryInfo from "./components/delivery-info";
import SubscriptionPlans from "./subscriptions/components/subscription-plans";
import ScrollTextBar from "./components/scrollbar/scrolltext";
import HeroHome from "./components/hero";

export default function Home() {
  return (
    <>
      {/* Full width components */}
      <HeroHome />
      <ScrollTextBar />
      
      {/* Contained components */}
      <div className="container mx-auto px-4">
        <div className="max-w-[1280px] mx-auto">
          <HowItWorks />
          <SubscriptionPlans />
          <DeliveryInfo />
        </div>
      </div>
    </>
  );
}
