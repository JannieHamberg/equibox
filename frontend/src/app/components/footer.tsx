'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');


  const faqItems = [
    {
      question: "Hur fungerar prenumerationen?",
      answer: "Vi skickar ut en ny box i början på varje månad med noggrant utvalda produkter för dig och din häst."
    },
    {
      question: "När skickas boxarna ut?",
      answer: "Boxarna skickas ut i början av varje månad."
    },
    {
      question: "Hur avbryter jag min prenumeration?",
      answer: "Du kan enkelt pausa eller avsluta din prenumeration när som helst via ditt konto eller genom att kontakta kundservice."
    },
    {
      question: "Vad kostar frakten?",
      answer: "Frakten ingår alltid i priset för din Equibox."
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await fetch("https://backend.equibox.se/wp-json/custom-mailpoet/v1/add-subscriber", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          lists: [4], 
        }),
      });
  
      const data = await response.json();
      console.log(data);
  
      if (response.ok) {
        setMessage("Du har prenumererat framgångsrikt!");
      } else {
        setMessage("Det gick inte att prenumerera. Försök igen.");
      }
    } catch (error) {
      console.error("Subscription Error:", error);
      setMessage("Ett oväntat fel inträffade. Försök igen senare.");
    }
  };
  
  

  return (
    <footer className="bg-[var(--color-dark-grey)] py-8 md:py-12 mt-20">
      {/* Email Subscription Section */}
      <div className="text-center mb-8 md:mb-12 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Prenumerera på vårt nyhetsbrev!</h2>
        <p className="text-gray-300 mb-4 text-sm md:text-base">Var först med att ta del av aktuella erbjudanden och de senaste nyheterna.</p>
        <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row justify-center gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="E-postadress"
            className="flex-1 border border-gray-300 px-4 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="bg-black text-white px-6 py-2 w-full md:w-auto" aria-label="Prenumerera">
            Få nyheter 
          </button>
        </form>
        {message && <p className="text-white mt-4">{message}</p>}
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo Column */}
          <div className="flex items-center justify-center md:justify-start h-20">
            <Image
              src="/favicon-logo/favicon-gold.webp"
              alt="Equibox Logo"
              width={120}
              height={80}
              priority
              className="h-auto w-auto md:w-[150px]"
            />
          </div>

          {/* Information Column */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-4 text-white text-lg">Snabblänkar</h3>
            <ul role="list" className="text-white space-y-2 md:space-y-1" aria-label="Footer navigation">
              <li role="listitem"><Link href="/" className="hover:underline">Startsidan</Link></li>
              <li role="listitem"><Link href="/join" className="hover:underline">Bli medlem</Link></li>
              <li role="listitem"><Link href="/past-boxes" className="hover:underline">Tidigare boxar</Link></li>
              <li role="listitem"><Link href="/member-shop" className="hover:underline">Member Shop</Link></li>
              <li role="listitem"><Link href="/login" className="hover:underline">Logga in</Link></li>
              <li role="listitem"><Link href="/signup" className="hover:underline">Skapa konto</Link></li>
              <li role="listitem"><Link href="/login" className="hover:underline">Mitt konto</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-4 text-white text-lg">Kontakt</h3>
            <ul className="space-y-2 text-white">
              <li>
                <a href="mailto:kundservice@equibox.se" className="hover:underline">
                  E-post: kundservice@equibox.se
                </a>
              </li>
              <li>
                <a href="tel:+46701234567" className="hover:underline">
                  Tel: 070-123 45 67
                </a>
              </li>
              <li>
                Equibox AB<br />
                Storgatan 123<br />
                114 52 Stockholm
              </li>
            </ul>
          </div>

          {/* FAQ Column */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-4 text-white text-lg">Vanliga frågor</h3>
            <div className="space-y-2 text-white">
              {faqItems.map((item, index) => (
                <div key={index} className="border-b border-white/20">
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full text-left py-2 flex justify-between items-center text-sm md:text-base"
                    aria-label="Öppna eller stäng frågan"
                  >
                    <span>{item.question}</span>
                    <span className="transform transition-transform duration-200">
                      {openAccordion === index ? '−' : '+'}
                    </span>
                  </button>
                  {openAccordion === index && (
                    <div className="pb-2 text-sm">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
