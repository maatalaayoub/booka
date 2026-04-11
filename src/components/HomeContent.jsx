'use client';

import Hero from '@/components/Hero';
import CategoryBrowse from '@/components/CategoryBrowse';
import BusinessCards from '@/components/BusinessCards';
import Footer from '@/components/Footer';

export default function HomeContent() {
  return (
    <main className="overflow-hidden bg-white">
      <Hero />
      <CategoryBrowse />
      <BusinessCards />
      <Footer />
    </main>
  );
}
