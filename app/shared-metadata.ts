import { Metadata } from "next";

// Determine base URL based on environment
export const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL
  : "https://scanalyze-fcds.vercel.app";

// Shared metadata properties
export const sharedMetadata = {
  metadataBase: new URL(baseUrl),
  generator: "Next.js",
  applicationName: "Scanalyze Medical",
  referrer: "origin-when-cross-origin" as const,
  keywords: [
    "medical diagnostics",
    "lab testing",
    "medical imaging",
    "health records",
    "healthcare",
    "medical scans",
  ],
  authors: [{ name: "Scanalyze Medical" }],
  colorScheme: "light" as const,
  creator: "Scanalyze Medical",
  publisher: "Scanalyze",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Scanalyze Medical",
  },
  twitter: {
    card: "summary_large_image" as const,
    creator: "@scanalyze",
  },
  icons: {
    icon: [
      { url: "/images/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/images/icon.png" }],
  },
};

// Function to create extended metadata
export function createMetadata(
  title: string,
  description: string,
  options: {
    ogImage?: string;
    noIndex?: boolean;
    isLandingPage?: boolean;
  } = {}
): Metadata {
  // For the landing page, use a special title that matches the hero section
  const isLandingPage = options.isLandingPage || title === "Scanalyze";
  const ogTitle = isLandingPage
    ? "Advanced Medical Diagnostics Simplified"
    : title;
  const ogDescription = isLandingPage
    ? "Cutting-edge laboratory testing and medical imaging with fast, accurate results. Your complete health information at your fingertips."
    : description;

  // Use the hero screenshot as default image
  const heroImage = `${baseUrl}/images/Scanalyze-hero.jpeg`;
  const ogImage = options.ogImage || heroImage;

  return {
    ...sharedMetadata,
    title,
    description,
    openGraph: {
      ...sharedMetadata.openGraph,
      title: ogTitle,
      description: ogDescription,
      url: baseUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      ...sharedMetadata.twitter,
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    ...(options.noIndex && {
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    }),
  };
}
