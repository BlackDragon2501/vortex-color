import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vórtex Color - Tus colores, sin límites",
  description: "Vórtex Color, de Vortex Company: extrae paletas de cualquier imagen, genera armonías de color, convierte entre HEX, RGB y HSL y comprueba el contraste WCAG. Gratis, sin anuncios y 100% local.",
  keywords: ["Vórtex Color","paleta de colores","extraer colores de imagen","armonías de color","contraste WCAG","convertidor HEX RGB HSL"],
  authors: [{ name: "Vortex Company" }],
  icons: {
    icon:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#161616"/><circle cx="18" cy="18" r="8" fill="#fbbf24"/><circle cx="30" cy="18" r="8" fill="#8b5cf6" fill-opacity="0.85"/><circle cx="18" cy="30" r="8" fill="#34d399" fill-opacity="0.85"/><circle cx="30" cy="30" r="8" fill="#f87171" fill-opacity="0.85"/></svg>`
      ),
  },
  openGraph: {
    title: "Vórtex Color - Tus colores, sin límites",
    description: "Vórtex Color, de Vortex Company: extrae paletas de cualquier imagen, genera armonías de color, convierte entre HEX, RGB y HSL y comprueba el contraste WCAG. Gratis, sin anuncios y 100% local.",
    siteName: "Vórtex Color - Tus colores, sin límites",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#0f0f10] text-[#ececf1]">{children}</body>
    </html>
  );
}
