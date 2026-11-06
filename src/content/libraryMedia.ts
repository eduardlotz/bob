// Content snapshot from the website reading page; newest entries first.
export interface MediaRecommendation { title: string; author: string; url: string; sitename?: string; durationMinutes?: number; }
export const libraryMedia: { blogs: MediaRecommendation[]; videos: MediaRecommendation[] } = {
  "blogs": [
    {
      "author": "Chester How",
      "sitename": "chester.how",
      "title": "What the heck is a digital garden?",
      "url": "https://lowercasedc.wordpress.com/2023/02/01/what-the-heck-is-a-digital-garden/"
    },
    {
      "author": "Laurel Schwulst",
      "title": "On eggs",
      "url": "https://laurelschwulst.com/e/on-eggs/"
    },
    {
      "author": "Aaron Swartz",
      "title": "How I Hire Programmers",
      "url": "http://www.aaronsw.com/weblog/hiring"
    },
    {
      "author": "Nicoly Dandara",
      "title": "The color of water",
      "url": "https://www.adandara.com/writing/the-color-of-water"
    },
    {
      "author": "Florian Kiem",
      "title": "Products that look better used",
      "url": "https://floriankiem.com/writing/products-that-look-better-used"
    },
    {
      "author": "Josh Puckett",
      "title": "On Being An Elder",
      "url": "https://joshpuckett.me/on-being-an-elder"
    },
    {
      "author": "Michael Ashcroft",
      "title": "The appropriate amount of effort is zero",
      "url": "https://expandingawareness.org/blog/the-appropriate-amount-of-effort-is-zero/"
    },
    {
      "author": "Mike Caulfield",
      "title": "The Garden and the Stream: A Technopastoral",
      "url": "https://hapgood.us/2015/10/17/the-garden-and-the-stream-a-technopastoral/"
    },
    {
      "author": "Anthony Hobday",
      "title": "Notes on software quality",
      "url": "https://anthonyhobday.com/blog/20260410"
    },
    {
      "author": "Benji Taylor",
      "title": "Family Values",
      "url": "https://benji.org/family-values"
    },
    {
      "author": "Marvin Schwaibold",
      "title": "The Performative Nature of Online Identities",
      "url": "https://www.marvinschwaibold.com"
    },
    {
      "author": "Anthony Hobday",
      "title": "Notes on visual design",
      "url": "https://anthonyhobday.com/blog/20260411"
    },
    {
      "author": "Benji Taylor",
      "title": "Honkish",
      "url": "https://benji.org/honkish"
    }
  ],
  "videos": [
    {
      "author": "James Woodall",
      "durationMinutes": 91,
      "sitename": "YouTube",
      "title": "Art Vs. Slop - Can AI make Art?",
      "url": "https://www.youtube.com/watch?v=A7C00C2T6K0"
    },
    {
      "author": "Wilson Miner",
      "durationMinutes": 42,
      "sitename": "YouTube",
      "title": "When we build",
      "url": "https://www.youtube.com/watch?v=i2FPU7bKD9k"
    },
    {
      "author": "Opus 23",
      "durationMinutes": 38,
      "sitename": "YouTube",
      "title": "Intelligence is Artificial",
      "url": "https://www.youtube.com/watch?v=1CbmC2aWhjY"
    },
    {
      "author": "Gabriela de Mendonça Gomes",
      "durationMinutes": 31,
      "sitename": "YouTube",
      "title": "The Forgotten Art of Desiring",
      "url": "https://www.youtube.com/watch?v=Gd2ys1V3fm4"
    },
    {
      "author": "Vosa",
      "durationMinutes": 25,
      "sitename": "YouTube",
      "title": "The World is a Word",
      "url": "https://www.youtube.com/watch?v=QyAqZQeR8V8"
    }
  ]
};
