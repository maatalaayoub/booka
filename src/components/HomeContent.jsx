'use client';

import Hero from '@/components/Hero';
import BusinessCards from '@/components/BusinessCards';
import Footer from '@/components/Footer';

export default function HomeContent() {
  return (
    <main className="overflow-hidden">
      <Hero />
      <BusinessCards />
      <Footer />
    </main>
  );
}
