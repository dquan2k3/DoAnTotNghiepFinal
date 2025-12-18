"use client";

import { useEffect } from "react";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/socket-events";


export function useChatSocket(userId: string, name?: string) {
    const socket = useSocket();

    // ---- Đăng ký user khi connect ----
    useEffect(() => {
        console.log("[useChatSocket] useEffect chạy vì dependency(s) thay đổi:", { socket, userId });
        if (!socket || !userId) return;

        socket.emit(SOCKET_EVENTS.USER_CONNECT, name);
    }, [socket, userId]);

    // ---- Gửi tin nhắn cá nhân ----
    function sendPrivateMessage(receiverId: string, message: string) {
        if (!socket || !socket.connected) return;

        socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
            senderId: userId,
            receiverId,
            message,
        });
    }

    // ---- Gửi tin nhắn nhóm (room) ----
    function sendRoomMessage(roomId: string, message: string) {
        if (!socket || !socket.connected) return;

        const messageData = {
            roomId,
            senderId: userId,
            senderName: name,
            message,
            createdAt: new Date(),
        };

        socket.emit(SOCKET_EVENTS.SEND_ROOM_MESSAGE, messageData);
    }

    // ---- Join group ----
    function joinRoom(roomId: string) {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomId);
    }

    // ---- Leave group ----
    function leaveRoom(roomId: string) {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.LEAVE_ROOM, roomId);
    }

    // ---- Lắng nghe message riêng & message group ----
    function listenMessages({
        onPrivateMessage,
        onRoomMessage,
    }: {
        onPrivateMessage?: (msg: any) => void;
        onRoomMessage?: (msg: any) => void;
    }) {
        if (!socket) return;

        // private
        const privateHandler = (data: any) => {
            onPrivateMessage?.(data);
        };

        // room
        const roomHandler = (data: any) => {
            onRoomMessage?.(data);
        };

        socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, privateHandler);


        socket.on(SOCKET_EVENTS.RECEIVE_ROOM_MESSAGE, roomHandler);

        return () => {
            socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, privateHandler);
            socket.off(SOCKET_EVENTS.RECEIVE_ROOM_MESSAGE, roomHandler);
        };
    }

    return {
        socket,
        joinRoom,
        leaveRoom,
        sendPrivateMessage,
        sendRoomMessage,
        listenMessages,
    };
}
