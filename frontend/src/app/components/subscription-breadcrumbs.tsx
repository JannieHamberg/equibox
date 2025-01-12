"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function SubscriptionBreadcrumbs() {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 mt-32">
      <div className="text-sm breadcrumbs max-w-[1280px] mx-auto mt-24">
        <ul>
          <li>
            <Link href="/">Startsida</Link>
          </li>
          <li className={pathname === "/userprofile" ? "text-primary" : ""}>
            <Link href="/userprofile">Välj prenumeration</Link>
          </li>
          <li className={pathname === "/checkout" ? "text-primary" : ""}>
            <Link href={pathname === "/checkout" ? "#" : ""}>Betalning</Link>
          </li>
          <li className={pathname === "/subscription-success" ? "text-primary" : ""}>
            <Link href={pathname === "/subscription-success" ? "#" : ""}>Bekräftelse</Link>
          </li>
        </ul>
      </div>
    </div>
  );
} 