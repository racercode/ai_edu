import "./globals.css";
export const metadata = { title: "Adaptive Textbook", description: "會隨學生理解而演化的教科書" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-Hant"><body>{children}</body></html>; }
