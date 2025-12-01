"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  const noHeaderRoutes = ["/auth", "/login", "/register"];
  const hideHeader = noHeaderRoutes.includes(pathname);

  return !hideHeader ? <Header /> : null;
}