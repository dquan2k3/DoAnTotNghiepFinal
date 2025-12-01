"use client";

import { InitHooks } from "@/hooks";
import Loading from "./ui/Loading";

export default function ClientInit({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCheckingAuth } = InitHooks();

  if (isCheckingAuth) {
    return <Loading />;
  }

  return <>{children}</>;
}
