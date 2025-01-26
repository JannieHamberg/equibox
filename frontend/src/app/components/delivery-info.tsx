'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DeliveryInfo() {


  return (
    <motion.section 
      className="py-6 md:py-16"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 bg-base-300 shadow-2xl rounded-lg">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-12">
          <div className="order-1 md:order-none relative h-[350px] md:h-[500px] lg:h-[650px] w-full">
            <Image
              src="/happy-horse-rider.webp"
              alt="Person receiving Equibox delivery"
              fill
              className="object-contain md:object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          
          <div className="order-2 md:order-none space-y-4 md:space-y-6 max-w-[480px] py-4 md:py-6">
            <p className="text-sm uppercase tracking-wider">För dig och din häst</p>
            
            <h2 className="text-3xl md:text-4xl font-bold text-accent">
              Vi levererar magi direkt till din dörr
            </h2>
            
            <p className="text-base-content">
              Vem gillar inte att få ett paket fyllt med godsaker för dig och din häst?
            </p>
            
            <p className="text-base-content">
              I varje box, oavsett om du väljer Hobby, Junior eller Competitor, hittar du 5-7 handplockade kvalitetsprodukter som gör hästvardagen både roligare och enklare.
            </p>
            
            <p className="text-base-content">
              För ett riktigt schysst pris hjälper vi dig att upptäcka de bästa produkterna inom hästvärlden.
            </p>
            
            <Link 
              href="/signup"
              className="inline-block bg-black text-white px-6 md:px-8 py-3 rounded-md hover:bg-[var(--color-gold)] transition-colors"
            >
              Prenumerera nu
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
} 