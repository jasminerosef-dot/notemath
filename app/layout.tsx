import type { Metadata } from "next";
import { Nunito, VT323, Press_Start_2P } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "NoteMath — send cute equations to friends 💕",
  description: "Type words and messages as equations, then send them to your friends via text.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${vt323.variable} ${pressStart.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-nunito), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
