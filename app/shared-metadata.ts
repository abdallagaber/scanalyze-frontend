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
    ? "Scanalyze - Advanced Medical Diagnostics Simplified"
    : title;
  const ogDescription = isLandingPage
    ? "Cutting-edge laboratory testing and medical imaging with fast, accurate results. Your complete health information at your fingertips."
    : description;

  // Use the hero screenshot for landing page and logo for other pages
  const heroImage = `${baseUrl}/images/Scanalyze-hero.jpeg`;
  const logoImage = `${baseUrl}/images/icon.png`;
  const defaultImage = isLandingPage ? heroImage : logoImage;
  const ogImage = options.ogImage || defaultImage;

  // Image dimensions
  const imageWidth = isLandingPage ? 1200 : 256;
  const imageHeight = isLandingPage ? 630 : 256;

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
          width: imageWidth,
          height: imageHeight,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      ...sharedMetadata.twitter,
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: imageWidth,
          height: imageHeight,
          alt: ogTitle,
        },
      ],
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
