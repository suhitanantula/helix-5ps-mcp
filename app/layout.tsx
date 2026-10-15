import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helix 5Ps MCP",
  description:
    "Open, no-login MCP server for the 5Ps of Loop Design by Suhit Anantula / The Helix Lab.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f7f5f1" }}>{children}</body>
    </html>
  );
}
