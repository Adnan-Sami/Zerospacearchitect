export function SchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "Zero Space Architect",
        "alternateName": ["ZeroSpace Architect", "ZeroSpaceArchitect", "ZeroSpace"],
        "url": "https://zerospacearchitect.com",
        "logo": "https://zerospacearchitect.com/logo.png",
        "description": "Best Architecture Firm in Bangladesh offering architectural consultancy, interior design, residential & commercial design services in Dhaka and Naogaon.",
        "telephone": "+8801521113539",
        "email": "zerospace.arc@gmail.com",
        "address": [
          {
            "@type": "PostalAddress",
            "streetAddress": "Naogaon Zilla Park-Small Gate, Park View, Flat-5A",
            "addressLocality": "Naogaon",
            "addressRegion": "Rajshahi",
            "postalCode": "6500",
            "addressCountry": "BD"
          },
          {
            "@type": "PostalAddress",
            "streetAddress": "RMST Tower, 3rd Floor, Baipail, Ashulia, Savar",
            "addressLocality": "Dhaka",
            "addressRegion": "Dhaka",
            "addressCountry": "BD"
          }
        ],
        "sameAs": ["https://www.facebook.com/share/1A2LiqRPFy/"],
        "areaServed": ["Bangladesh", "Dhaka", "Naogaon"]
      },
      {
        "@type": "LocalBusiness",
        "name": "Zero Space Architect - Dhaka Office",
        "image": "https://zerospacearchitect.com/logo.png",
        "telephone": "+8801521113539",
        "email": "zerospace.arc@gmail.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "RMST Tower, 3rd Floor, Baipail, Ashulia, Savar",
          "addressLocality": "Dhaka",
          "addressCountry": "BD"
        },
        "priceRange": "৳৳",
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "09:00",
          "closes": "23:00"
        }
      },
      {
        "@type": "LocalBusiness",
        "name": "Zero Space Architect - Naogaon Office",
        "image": "https://zerospacearchitect.com/logo.png",
        "telephone": "+8801521113539",
        "email": "zerospace.arc@gmail.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Naogaon Zilla Park-Small Gate, Park View, Flat-5A",
          "addressLocality": "Naogaon",
          "postalCode": "6500",
          "addressCountry": "BD"
        },
        "priceRange": "৳৳"
      },
      {
        "@type": "WebSite",
        "name": "Zero Space Architect",
        "url": "https://zerospacearchitect.com",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://zerospacearchitect.com/courses?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
