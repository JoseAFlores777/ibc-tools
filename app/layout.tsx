import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/app/lib/shadcn/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "IBC | El Calvario",
  description: "Iglesia Bautista El Calvario",
  icons: {
    icon: {
      url: "/favicon_io/favicon-32x32.png",
      type: "image/png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://analytics.joseiz.com/script.js"
              data-website-id="097889f1-b030-4066-9a99-29e6e308ac27"
              strategy="afterInteractive"
            />
            {process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL &&
              process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN && (
                <Script
                  id="chatwoot-inline"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                    __html: `
                      (function(d,t){
                        var BASE_URL='${process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL}';
                        var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                        g.src=BASE_URL+'/packs/js/sdk.js';
                        g.defer=true; g.async=true;
                        s.parentNode.insertBefore(g,s);
                        g.onload=function(){
                          if (window && window.chatwootSDK && typeof window.chatwootSDK.run === 'function') {
                            window.chatwootSDK.run({ websiteToken:'${process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN}', baseUrl: BASE_URL });
                          }
                        };
                      })(document,'script');
                    `,
                  }}
                />
              )}
          </>
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
