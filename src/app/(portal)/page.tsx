import { CompaniesSection } from "@/components/home/companies-section";
import { Directory } from "@/components/home/directory";
import { Hero } from "@/components/home/hero";
import { QuickAccess } from "@/components/home/quick-access";
import { SafetySection } from "@/components/home/safety-section";

export default function Home() {
  return (
    <>
      <Hero />
      <QuickAccess />
      <Directory />
      <SafetySection />
      <CompaniesSection />
    </>
  );
}
