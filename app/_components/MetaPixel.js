// Meta Pixel Component for Next.js
// Pixel ID: 1229999147037503 (Block-Plan Pixel)
//
// HOW TO INSTALL:
// 1. Copy this file into your Next.js project (e.g., src/components/MetaPixel.js)
// 2. Import it in your root layout file (app/layout.js or app/layout.tsx)
// 3. Add <MetaPixel /> inside the <head> or <body> tag
//
// Example in app/layout.js:
//
//   import MetaPixel from '@/components/MetaPixel'
//
//   export default function RootLayout({ children }) {
//     return (
//       <html lang="en">
//         <head>
//           <MetaPixel />
//         </head>
//         <body>{children}</body>
//       </html>
//     )
//   }

'use client'

import Script from 'next/script'

const META_PIXEL_ID = '1229999147037503'

export default function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}


// --- OPTIONAL: Track specific events ---
// You can call these functions anywhere in your app to track conversions.
// Import them like: import { trackSignUp, trackLead } from '@/components/MetaPixel'

export function trackSignUp() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration')
  }
}

export function trackLead() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead')
  }
}

export function trackStartTrial() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'StartTrial')
  }
}
