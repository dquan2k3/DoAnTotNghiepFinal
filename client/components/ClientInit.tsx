"use client";

import { InitHooks } from "@/hooks";
import Loading from "./ui/Loading";

export default function ClientInit({
  children,
}: {
  children: React.ReactNode;
}) {
   InitHooks();
   
  return <>{children}</>;


  return
}
