import { Metadata } from "next";

const title = "Scanalyze";
const description =
  "Scanalyze delivers cutting-edge laboratory testing and medical imaging with fast, accurate results. Your complete health information at your fingertips.";

// Determine base URL - in a real environment, you should use environment variables
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://scanalyze-fcds.vercel.app";

export const metadata: Metadata = {
  title: title,
  description: description,
  generator: "Next.js",
  applicationName: "Scanalyze Medical",
  referrer: "origin-when-cross-origin",
  keywords: [
    "medical diagnostics",
    "lab testing",
    "medical imaging",
    "health records",
    "healthcare",
    "medical scans",
  ],
  authors: [{ name: "Scanalyze Medical" }],
  colorScheme: "light",
  creator: "Scanalyze Medical",
  publisher: "Scanalyze",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
  openGraph: {
    title: title,
    description: description,
    url: baseUrl,
    siteName: "Scanalyze Medical",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent(
          "Advanced Medical Diagnostics Simplified"
        )}`,
        width: 1200,
        height: 630,
        alt: "Scanalyze Medical Diagnostics",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: title,
    description: description,
    creator: "@scanalyze",
    images: [
      `/api/og?title=${encodeURIComponent(
        "Advanced Medical Diagnostics Simplified"
      )}`,
    ],
  },
  verification: {
    google: "google-site-verification=your-verification-code",
    yandex: "yandex-verification-code",
  },
};
