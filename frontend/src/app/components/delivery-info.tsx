'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DeliveryInfo() {
  return (
    <motion.section 
      className="py-16"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 bg-base-300 shadow-2xl rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative h-[650px]">
            <Image
              src="/happy-horse-rider.webp"
              alt="Person receiving Equibox delivery"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div className="space-y-6 max-w-[480px]">
            <p className="text-sm uppercase tracking-wider">För dig och din häst</p>
            
            <h2 className="text-4xl font-bold text-accent">
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
              className="inline-block bg-black text-white px-8 py-3 rounded-md hover:bg-[var(--color-gold)] transition-colors"
            >
              Prenumerera nu
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
} 