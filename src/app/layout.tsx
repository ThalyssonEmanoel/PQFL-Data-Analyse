import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PQFL Dashboard",
  description: "Gestão do Plano de Qualificação de Fornecedores de Leite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
