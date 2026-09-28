import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vidhi Pragati | National IP Moot Court Competition (IPMC)",
  description: "Official portal for Vidhi Pragati: National IP Moot Court Competition organized by CIIPC & IPR Chair, NLU Delhi in collaboration with DPIIT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#16100E] text-[#FAF8ED] antialiased">
        {children}
      </body>
    </html>
  );
}