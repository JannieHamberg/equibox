import Link from "next/link";

export default function PastBoxes() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto mt-24">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-base-content">
          Hoppsan! Här var det tomt
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-8">
          Välkommen åter efter lansering. Snart fylls denna sida med massor av spännande tidigare boxar!
        </p>
        <Link 
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded-sm hover:bg-gray-800 transition-colors"
        >
          Tillbaka till startsidan
        </Link>
      </div>
    </div>
  );
} 