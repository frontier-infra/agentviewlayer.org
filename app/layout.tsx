import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agent View Layer",
  description:
    "The public standards home and validator for Agent View Layer, a producer-owned web view for AI agents.",
  metadataBase: new URL("https://agentviewlayer.org"),
  alternates: {
    canonical: "/",
    types: {
      "text/agent-view": "/.agent",
    },
  },
  openGraph: {
    title: "Agent View Layer",
    description:
      "Validate and implement producer-owned text/agent-view companions for AI agents.",
    url: "https://agentviewlayer.org",
    siteName: "Agent View Layer",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3e8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
