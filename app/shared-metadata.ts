import { Metadata } from "next";

// Determine base URL based on environment
export const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://scanalyze-fcds.vercel.app";

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
  } = {}
): Metadata {
  const ogImage =
    options.ogImage || `/api/og?title=${encodeURIComponent(title)}`;

  return {
    ...sharedMetadata,
    title,
    description,
    openGraph: {
      ...sharedMetadata.openGraph,
      title,
      description,
      url: baseUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      ...sharedMetadata.twitter,
      title,
      description,
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
