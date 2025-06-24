"use client";

import { usePathname } from "next/navigation";
import Header from "./ui/header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const showHeader = !pathname.startsWith("/chatbot");

  return showHeader ? <Header /> : null;
}
