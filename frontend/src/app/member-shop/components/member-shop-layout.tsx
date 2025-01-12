import Image from 'next/image';

const categories = [
  {
    title: "Boxarna",
    items: "0 produkter",
    imageUrl: "/boxar/competitor-boxen.webp",
    alt: "Equibox prenumerationsboxar"
  },
  {
    title: "Hästvård & Stalltillbehör",
    items: "0 produkter",
    imageUrl: "/membershop/horse-care.webp",
    alt: "Hästvård och stalltillbehör"
  },
  {
    title: "Heminredning",
    items: "0 produkter",
    imageUrl: "/membershop/home-goods.webp",
    alt: "Hästinspirerad inredning"
  },
  {
    title: "Smycken",
    items: "0 produkter",
    imageUrl: "/membershop/jewelry.webp",
    alt: "Hästinspirerade smycken"
  },
  {
    title: "Ryttare",
    items: "0 produkter",
    imageUrl: "/membershop/ryttare.webp",
    alt: "Produkter till ryttare"
  }
];

export default function MemberShopLayout() {
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-[1280px] mx-auto mt-32">
        <h1 className="text-3xl font-bold text-center mb-12">Välkommen till medlemsbutiken</h1>
        
        {/* Categories Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
          {categories.map((category, index) => (
            <div key={index} className="text-center">
              <div className="relative h-[200px] mb-2 bg-base-200 rounded-lg overflow-hidden">
                <Image
                  src={category.imageUrl}
                  alt={category.alt}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60">
                  <div className="absolute top-2 left-2">
                    <span className="text-sm font-medium text-white">Kommer snart!</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-md font-bold  text-white">{category.title}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">{category.items}</p>
            </div>
          ))}
        </div>

        {/* Filter and Products Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            {/* Filter Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Filter</h2>
              <button className="text-sm text-gray-500">Reset</button>
            </div>

            {/* Availability Filter */}
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" defaultChecked /> 
              <div className="collapse-title font-medium">
                Tillgänglighet
              </div>
              <div className="collapse-content">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">I lager (0)</span>
                    <input type="checkbox" className="checkbox" />
                  </label>
                  <label className="label cursor-pointer">
                    <span className="label-text">Slut i lager (0)</span>
                    <input type="checkbox" className="checkbox" />
                  </label>
                </div>
              </div>
            </div>

            {/* Price Filter */}
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title font-medium">
                Pris
              </div>
              <div className="collapse-content">
                <div className="form-control">
                  <input type="range" min="0" max="1000" className="range" step="100" />
                  <div className="flex justify-between text-xs px-2">
                    <span>0 kr</span>
                    <span>1000 kr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Area */}
          <div className="flex-1">
            {/* Sort Controls */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm">0 produkter</span>
              <div className="flex items-center gap-4">
                <select className="select select-bordered select-sm">
                  <option>Datum, nyast först</option>
                  <option>Datum, äldst först</option>
                  <option>Pris, lågt till högt</option>
                  <option>Pris, högt till lågt</option>
                </select>
                <div className="flex gap-2">
                  <button className="btn btn-square btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                  </button>
                  <button className="btn btn-square btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Empty Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative h-[300px] mb-4 bg-base-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-lg font-semibold">Kommer snart!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 