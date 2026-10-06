import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: '3rd Vidhi Pragati | National IP Moot Court Competition (IPMC) 2027',
  description: 'Official website of the Vidhi Pragati: National IP Moot Court Competition organised by CIIPC & IPR Chair, NLU Delhi in collaboration with DPIIT.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#FFFDF7] text-[#0A192F] antialiased selection:bg-[#8B0000] selection:text-[#FFFDF7]">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}