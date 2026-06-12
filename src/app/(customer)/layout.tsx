import { defaultTheme, getThemeStyles } from '@/lib/theme';
import Script from 'next/script';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const styles = getThemeStyles(defaultTheme);

  return (
    <div 
      style={styles} 
      className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300"
    >
      {/* Load Razorpay securely for the customer checkout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {children}
    </div>
  );
}