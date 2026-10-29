import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFCF5" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1C1A" },
  ],
};

export const metadata: Metadata = {
  title: "LearnFlow — AI Study & Practice Tutor",
  description:
    "AI-enhanced educational platform for exam prep, coding interviews, and language learning with dynamic practice generation, instant grading, and streaming step-by-step explanations.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LearnFlow",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "LearnFlow — AI Study & Practice Tutor",
    description:
      "AI-enhanced educational platform for exam prep, coding interviews, and language learning with dynamic practice generation, instant grading, and streaming step-by-step explanations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnFlow — AI Study & Practice Tutor",
    description:
      "AI-enhanced educational platform for exam prep, coding interviews, and language learning with dynamic practice generation, instant grading, and streaming step-by-step explanations.",
  },
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('learnflow-theme');
    var root = document.documentElement;
    if (saved === 'light' || saved === 'dark') {
      root.dataset.theme = saved;
    } else {
      delete root.dataset.theme;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <a href="/vision/index.html" style={{ display: 'block', width: 'fit-content', margin: '16px auto', padding: '12px 18px', border: '1px solid currentColor', borderRadius: 999, fontSize: 14, textDecoration: 'none' }}>Try on-device vision (preview)</a>
      </body>
    </html>
  );
}
