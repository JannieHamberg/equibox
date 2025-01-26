'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      icon: "/how-it-works/step1.webp",
      title: "Gå med i klubben",
      description: "Välj ditt medlemskap och varje säsong får du en noggrant utvald box fylld med 5-7 produkter för både häst och ryttare.",
      step: "1"
    },
    {
      icon: "/how-it-works/step2.webp",
      title: "Få din box",
      description: "Boxen levereras till din dörr varje säsong, fylld med det bästa inom hästvälfärd, stil, skötsel, heminredning och mycket mer.",
      step: "2"
    },
    {
      icon: "/how-it-works/step3.webp",
      title: "Upptäck dina nya favoriter",
      description: "Upptäck nya produkter och varumärken samtidigt som du stödjer andra småföretag och märken som gör spännande saker inom hästvärlden.",
      step: "3"
    },
    {
      icon: "/how-it-works/step4.webp",
      title: "Vår gemenskap",
      description: "Gå med i vår Equibox-gemenskap av hästmänniskor från alla discipliner. Få exklusiva erbjudanden, förhandsvisningar och mer!",
      step: "4"
    }
  ];

  return (
    <motion.section 
    className="py-16 "
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 1.2 }}
    viewport={{ once: true, margin: "-200px" }}
    >
      <div className="container mx-auto px-4 pt-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12 text-base-content">
          SÅ FUNGERAR DET
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-left relative">
              <span className="absolute -top-4 left-0 text-xl md:text-2xl font-bold flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--color-gold-light)] text-white">
                {step.step}
              </span>
              <div className="flex justify-center mb-6 h-[100px]">
                <Image
                  src={step.icon}
                  alt={step.title}
                  width={100}
                  height={100}
                  className="w-auto h-auto object-contain"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-base-content">{step.title}</h3>
              <p className="text-base-content text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
} 