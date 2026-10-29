import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexaMind AI — Le savoir de votre équipe",
  description:
    "Organisez vos ressources et retrouvez les réponses qui comptent avec NexaMind AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
