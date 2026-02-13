import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TaxFilingProvider } from "@/contexts/TaxFilingContext";
import { ChatProvider } from "@/contexts/ChatContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taxxon - Canadian Tax Filing Made Simple",
  description: "File your Canadian taxes with confidence. Simple, secure, and stress-free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TaxFilingProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </TaxFilingProvider>
      </body>
    </html>
  );
}
