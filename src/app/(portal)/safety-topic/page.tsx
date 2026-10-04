import type { Metadata } from "next";
import { SafetyArchive } from "./safety-archive";

export const metadata: Metadata = {
  title: "Safety Topic",
  description: "Arsip materi safety talk harian PT Global Inti Sejati — cari berdasarkan kata kunci dan periode.",
};

export default function SafetyTopicPage() {
  return <SafetyArchive />;
}
