import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Vidhi Pragati | National IP Moot Court Competition (IPMC)',
  description: 'Official portal for Vidhi Pragati: National IP Moot Court Competition organized by CIIPC & IPR Chair, NLU Delhi in collaboration with DPIIT.',
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