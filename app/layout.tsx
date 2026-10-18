import type { Metadata } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LearnFlow — AI Study & Practice Tutor',
  description:
    'AI-enhanced educational platform for exam prep, coding interviews, and language learning with dynamic practice generation, instant grading, and streaming step-by-step explanations.',
  openGraph: {
    title: 'LearnFlow — AI Study & Practice Tutor',
    description:
      'AI-enhanced educational platform for exam prep, coding interviews, and language learning with dynamic practice generation, instant grading, and streaming step-by-step explanations.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LearnFlow — AI Study & Practice Tutor',
    description:
      'AI-enhanced educational platform for exam prep, coding interviews, and language learning with dynamic practice generation, instant grading, and streaming step-by-step explanations.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
