"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSocket } from "./socket";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "./socket-events";

type SocketType = Socket | null;

const SocketContext = createContext<SocketType>(null);
export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState(() => getSocket());
  useEffect(() => {
    if (!socket) return;

    socket.connect();
    console.log("Client socket connecting...");

    function onConnect() {
      console.log("Client socket connected:", socket.id);
    }
    socket.on(SOCKET_EVENTS.CONNECT, onConnect);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.disconnect();
      console.log("Client socket disconnected");
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
