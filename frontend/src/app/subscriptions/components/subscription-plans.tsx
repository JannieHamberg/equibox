"use client";

import styles from "../subscriptions.module.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import SubscriptionDetailsModal from './subscription-details-modal';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { Prenumerationer } from '@/types/subscription';

function truncateDescription(description: string): string {
  const firstSentence = description.split(/[.!?]/)
    .filter(sentence => sentence.trim().length > 0)[0];
  return firstSentence ? `${firstSentence.trim()}...` : description;
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Prenumerationer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Prenumerationer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/subscriptions/prenumerationer"); 
        if (!response.ok) throw new Error("Failed to fetch subscription plans");
        const data = await response.json();
        setPlans(data.data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    fetchPlans();
  }, []);

  if (error) return <div>Error: {error}</div>;

  const handleOpenModal = (plan: Prenumerationer) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <>
      <motion.section
        className="py-6 md:py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, margin: "-200px" }}
      >
        <div className="container mx-auto px-4 pt-6 md:pt-10 bg-base-300 shadow-2xl rounded-lg pb-8 md:pb-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-12">
            VÅRA BOXAR
          </h2>
          <div className={`relative ${styles.swiperNavigation}`}>
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={32}
              slidesPerView={1}
              breakpoints={{
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                }
              }}
              className="px-8"
            >
              {plans.map((plan) => (
                <SwiperSlide key={plan.id}>
                  <div className={`card bg-base-100 shadow-xl ${styles.cardNoRadius} ${styles.cardCustom} max-w-sm mx-auto`}>
                    <figure className="h-[200px] md:h-[250px]">
                      <Image
                        src={plan.image_url || '/boxar/fallback-image.webp'}
                        alt={plan.name}
                        width={300}
                        height={250}
                        style={{ objectFit: "contain" }}
                        className="w-full h-full"
                      />
                    </figure>
                    <div className="card-body p-4 md:p-6">
                      <h2 className="card-title text-lg md:text-xl">{plan.name}</h2>
                      <p className="text-sm md:text-base">{truncateDescription(plan.description)}</p>
                      <p className="text-base md:text-lg font-semibold">
                        {plan.price} SEK / månadsvis
                      </p>
                      <div className="card-actions justify-end">
                        <button 
                          className="btn btn-sm md:btn-md" 
                          aria-label="Detaljer"
                          onClick={() => handleOpenModal(plan)}
                        >
                          Detaljer
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </motion.section>

      <SubscriptionDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plan={selectedPlan}
      />
    </>
  );
}
