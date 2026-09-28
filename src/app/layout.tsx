import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vidhi Pragati | National IP Moot Court Competition (IPMC)",
  description: "Official portal for Vidhi Pragati: National IP Moot Court Competition organized by CIIPC & IPR Chair, NLU Delhi in collaboration with DPIIT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-[#16100E] text-[#FAF8ED] antialiased">
        {children}
      </body>
    </html>
  );
}