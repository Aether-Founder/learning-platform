import { HomePageClient } from "@/components/HomePageClient";
import { getContentFiles } from "@/lib/content-index";

export default async function ToetsweekvoorbereidingPage() {
  const contentFiles = getContentFiles();

  return <HomePageClient contentFiles={contentFiles} />;
}
