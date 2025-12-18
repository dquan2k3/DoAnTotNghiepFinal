"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL!;
    console.log("Creating socket to:", url);

    socket = io(url, {
      autoConnect: false,
      transports: ["websocket"],
      withCredentials: true, 
    });
  }
  return socket;
}
