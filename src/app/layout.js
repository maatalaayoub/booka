import localFont from "next/font/local";
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";

const geistSans = localFont({
  src: "../../public/font/GeistVF.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});


export const metadata = {
  title: "Booka.ma - Book Any Appointment in Seconds",
  description: "The smartest way to book appointments with any service provider. Instant booking, smart queue system, and mobile services. Download the app today!",
  keywords: ["booking", "appointment", "service provider", "queue system", "mobile service", "online booking", "booka"],
  authors: [{ name: "Booka.ma" }],
  openGraph: {
    title: "Booka.ma - Book Any Appointment in Seconds",
    description: "The smartest way to book appointments with any service provider. Instant booking, smart queue system, and mobile services.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
