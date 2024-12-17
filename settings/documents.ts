
export const Documents = [
  {
    title: "Introduction",
    href: "/introduction",
    heading: "Getting Started",
    items: [
      {
        title: "Getting Started",
        href: "/getting-started",
        items: [
          {
            title: "Authentication",
            href: "/authentication",
          },
          {
            title: "Rate Limits",
            href: "/rate-limits",
          }
        ]
      },
      {
        title: "Core Concepts",
        href: "/core-concepts",
        items: [
          {
            title: "Rivers",
            href: "/rivers",
          },
          {
            title: "Snow Cover",
            href: "/snow-cover",
          }
        ]
      }
    ],
  },
  {
    spacer: true,
  },
  {
    title: "API Reference",
    href: "/api-reference",
    heading: "Endpoints",
    items: [
      {
        title: "Files",
        href: "/files",
        items: [
          {
            title: "Snow Cover Area",
            href: "/snow-cover-area",
          },
          {
            title: "Snow Cover Dynamics",
            href: "/snow-dynamics",
          }
        ]
      },
      {
        title: "Rivers",
        href: "/rivers",
        items: [
          {
            title: "Get All Rivers",
            href: "/get-all-rivers",
          },
          {
            title: "Get Specific River",
            href: "/get-specific-river",
          }
        ]
      }
    ],
  },
  {
    spacer: true,
  },
  {
    title: "Guides",
    href: "/guides",
    heading: "Examples",
    items: [
      {
        title: "Best Practices",
        href: "/best-practices",
      },
      {
        title: "Examples",
        href: "/examples",
        items: [
          {
            title: "cURL",
            href: "/curl",
          },
          {
            title: "JavaScript",
            href: "/javascript",
          },
          {
            title: "Python",
            href: "/python",
          }
        ]
      },
      {
        title: "Error Handling",
        href: "/error-handling",
      },
      {
        title: "Rate Limiting",
        href: "/rate-limiting",
      }
    ],
  },
  {
    spacer: true,
  },
  {
    title: "Support",
    href: "/support",
    heading: "Help",
    items: [
      {
        title: "FAQ",
        href: "/faq",
      },
      {
        title: "Troubleshooting",
        href: "/troubleshooting",
      }
    ],
  }
] as const;