export const metadata = {
  title: "TMO Inteligente — Licencias",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "monospace", background: "#0B0D0E", color: "#D6FF3F" }}>
        {children}
      </body>
    </html>
  );
}
