import type { MetadataRoute } from "next"

/** Allows crawlers to read public pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  }
}
