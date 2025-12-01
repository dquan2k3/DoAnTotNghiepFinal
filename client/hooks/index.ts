"use client";

import { useInitUser } from "./initUser";
import { useCheckLogin } from "./checkLogin";

export function InitHooks() {
  const isCheckingAuth = useCheckLogin();
  useInitUser();

  return {
    isCheckingAuth,
  };
}
    