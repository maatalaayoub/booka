'use client';

import { useUser } from '@clerk/nextjs';
import Hero from '@/components/Hero';
import BusinessCards from '@/components/BusinessCards';
import BarberFeatures from '@/components/BarberFeatures';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import AppShowcase from '@/components/AppShowcase';
import Footer from '@/components/Footer';

export default function HomeContent() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <main className="overflow-hidden">
      <Hero />
      {isLoaded && isSignedIn ? (
        <BusinessCards />
      ) : (
        <>
          <HowItWorks />
          <Features />
          <BarberFeatures />
          <AppShowcase />
          <Footer />
        </>
      )}
    </main>
  );
}
