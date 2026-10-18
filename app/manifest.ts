import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'LearnFlow — AI Study & Practice Tutor',
    short_name: 'LearnFlow',
    description:
      'AI-enhanced educational platform for exam prep, coding interviews, and language learning with dynamic practice generation, instant grading, and step-by-step tutoring.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FFFCF5',
    theme_color: '#FFFCF5',
    categories: ['education', 'productivity', 'books'],
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Daily AI Quiz',
        short_name: 'Daily Quiz',
        description: 'Jump straight into your adaptive SAT & Math sprint',
        url: '/?track=exam',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Coding Interview Lab',
        short_name: 'Coding Prep',
        description: 'Practice Two Pointers, Sliding Window & Algorithms',
        url: '/?track=code',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Spanish Fluency Sprint',
        short_name: 'Spanish',
        description: 'Practice Subjunctive & conversational grammar',
        url: '/?track=lang',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
