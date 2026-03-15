import HomeContent from '@/components/HomeContent';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }, { locale: 'ar' }];
}

export default function Home() {
  return <HomeContent />;
}
