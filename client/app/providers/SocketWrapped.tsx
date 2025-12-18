"use client";

import { ReactNode } from "react";
import { SocketProvider } from "../../socket/SocketProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function SocketWrapped({ children }: ProvidersProps) {
  return <SocketProvider>{children}</SocketProvider>;
}
