import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";

export const metadata = {
  title: "AI Banking Advisor — Your Smart Pakistani Banking Consultant",
  description:
    "Intelligent AI-powered banking advisor for Pakistan. Get personalized bank recommendations, compare products, and get guided through banking processes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
