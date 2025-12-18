"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChatSocket } from "@/socket/useChatSocket";
// Thêm
import { useSelector } from "react-redux";

const ROOM_ID = "global-room-test";

export default function SimpleGroupChat() {
  // Dùng useSelector để lấy user từ Redux store (giả sử slice là user, có thể cần chỉnh lại cho đúng app)
  const user = useSelector((state: any) => state.user);
  // Log tất cả thông tin từ user:
  useEffect(() => {
    if (user) {
      console.warn("user:", user);
    }
  }, [user]);
  const userId = user.userId;

  const [messages, setMessages] = useState<{ senderId: string; message: string }[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // import và sử dụng hook useChatSocket
  const {
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    listenMessages,
  } = useChatSocket(userId);

  // Chỉ join/leave room khi userId thực sự đổi, không phải khi hook listenMessages đổi theo tham chiếu mới mỗi lần render
  useEffect(() => {
    if (!userId) return;
    joinRoom(ROOM_ID);
    return () => {
      leaveRoom(ROOM_ID);
    };
  }, [userId]);

  useEffect(() => {
    const off = listenMessages({
      onRoomMessage: (msg: any) => {
        console.log("[LISTEN][RoomMessage]", msg);
        setMessages((prev) => [...prev, msg]);
      },
      onPrivateMessage: (msg: any) => {
        console.log("[LISTEN][PrivateMessage]", msg);
      },
    });
    return () => off?.();
  }, []);


  useEffect(() => {
    // Tự động scroll xuống cuối
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !userId) return;
    const msgContent = text.trim();
    // Hiện tin nhắn vừa gửi luôn (giống realtime như Zalo/Messenger)
    setMessages((prev) => [...prev, { senderId: userId, message: msgContent }]);
    sendRoomMessage(ROOM_ID, msgContent);
    setText("");
  };

  if (!userId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#18181b]">
        <div className="bg-[#232326] rounded-lg p-8 shadow-xl flex flex-col items-center">
          <h2 className="text-2xl font-bold text-white mb-4">Bạn chưa đăng nhập, không thể vào nhóm chat</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#18181b]">
      <div className="w-full max-w-xl bg-[#232326] rounded-lg shadow-xl flex flex-col h-[80vh]">
        <div className="p-4 border-b border-[#323238] text-white font-bold flex items-center">
          Phòng Chat Test Socket - User: <span className="ml-2 text-blue-400">{userId}</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-2" style={{ background: "#25252b" }}>
          {messages.length === 0 && (
            <div className="text-gray-400 text-center">Chưa có tin nhắn nào.</div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded px-4 py-2 max-w-[70%] break-words ${msg.senderId === userId
                  ? "bg-blue-500 text-white"
                  : msg.senderId === "system"
                    ? "bg-gray-700 text-yellow-300"
                    : "bg-[#3e3e45] text-white"
                  }`}
              >
                <span className="text-xs opacity-70">
                  {msg.senderId !== userId && msg.senderId !== "system" ? msg.senderId + ": " : ""}
                </span>
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="p-4 border-t border-[#323238] flex gap-2" onSubmit={sendMessage}>
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring focus:ring-blue-400 text-black"
            value={text}
            autoFocus
            placeholder="Nhập tin nhắn..."
            onChange={(e) => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }}
          />
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-60"
            disabled={!text.trim()}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
