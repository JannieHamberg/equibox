"use client";
import Image from "next/image";
import { useState } from "react";
import { PickSubscriptionProps, SubscriptionPlan } from '@/types/subscription';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import SubscriptionUpdateModal from './subscription-update-modal';

export default function UpdateSubscription({ availablePlans, onSelectPlan }: PickSubscriptionProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    description: string;
    price: number;
    image_url: string;
  } | null>(null);

  return (
    <div className="mt-8 w-full">
      <div className="w-full ">
        <h1 className="text-lg md:text-3xl font-bold mb-8 text-left md:text-center">Välj ny prenumerationsbox</h1>
        <Swiper
          spaceBetween={10}
          pagination={{ clickable: true }}
          modules={[Pagination]}
          breakpoints={{
            768: {
              slidesPerView: 3,
              spaceBetween: 20
            },
            0: {
              slidesPerView: 1,
              spaceBetween: 0
            }
          }}
          className="w-full"
        >
          {availablePlans.map((plan) => (
            <SwiperSlide key={plan.id}>
              <div className="card bg-base-100 shadow-xl h-[500px] flex flex-col cursor-pointer"
                   onClick={() => {
                     setSelectedPlan({
                       name: plan.name,
                       description: plan.description,
                       price: plan.price,
                       image_url: plan.image_url
                     });
                     setModalOpen(true);
                   }}>
                <figure className="p-3">
                  <Image
                    src={plan.image_url} 
                    alt={plan.name}       
                    width={300}           
                    height={200}         
                    className="w-full h-48 object-contain" 
                  />
                </figure>
                <div className="card-body flex flex-col p-4">
                  <div>
                    <h2 className="card-title">{plan.name}</h2>
                    <p className="line-clamp-3">{plan.description}</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-4">
                      {plan.price} SEK / {plan.interval === "monthly" ? "månadsvis" : plan.interval}
                    </p>
                    <div className="card-actions justify-end">
                      <button
                        className={`btn w-full ${selectedPlanId === plan.id ? "btn-neutral" : "btn-outline"}`}
                        aria-label="Välj prenumerationsbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(plan.id);
                          if (onSelectPlan) {
                            onSelectPlan(plan.id);
                          }
                        }}
                      >
                        {selectedPlanId === plan.id ? "Vald" : "Välj"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <SubscriptionUpdateModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          plan={selectedPlan}
        />
      </div>
    </div>
  );
} 