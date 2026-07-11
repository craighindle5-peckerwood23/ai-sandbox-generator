import "./globals.css";
import ThemeShell from "./ThemeShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeShell>
          {children}
        </ThemeShell>
      </body>
    </html>
  );
}