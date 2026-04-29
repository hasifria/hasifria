import type { Metadata } from "next";
import { getSeoTemplates } from "@/lib/seo";
import HomeClient from "./HomeClient";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoTemplates("home");
  return {
    title: seo.title_template,
    description: seo.description_template,
    openGraph: {
      title: seo.title_template,
      description: seo.description_template,
      images: ["/hasifria_logo.jpg"],
    },
  };
}

export default function Home() {
  return <HomeClient />;
}
