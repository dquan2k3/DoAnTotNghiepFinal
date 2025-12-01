"use client";
import React from "react";
import Link from "next/link";

function SuggestFriendCard({ name, avatar }: { name: string; avatar: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border"
      />
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <button className="text-xs mt-1 px-3 py-0.5 bg-zinc-800 text-white rounded hover:bg-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition">
          Kết bạn
        </button>
      </div>
    </div>
  );
}

function Post({ user, content, image, time }: { user: { name: string; avatar: string }, content: string, image?: string, time: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow mb-6 p-5 border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-3 mb-2">
        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border" />
        <div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-xs text-zinc-500">{time}</div>
        </div>
      </div>
      <div className="mb-3 text-zinc-800 dark:text-zinc-200">{content}</div>
      {image && (
        <div className="mb-3">
          <img src={image} alt="post" className="rounded-md w-full max-h-80 object-cover shadow-sm" />
        </div>
      )}
      <div className="flex gap-5 items-center text-zinc-500 text-sm">
        <button className="hover:text-blue-600 transition flex items-center gap-1">
          <span>👍</span> Thích
        </button>
        <button className="hover:text-blue-600 transition flex items-center gap-1">
          <span>💬</span> Bình luận
        </button>
        <button className="hover:text-blue-600 transition flex items-center gap-1">
          <span>↗</span> Chia sẻ
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  // Placeholder data
  const posts = [
    {
      user: { name: "Trần Thị Lan", avatar: "/avatar1.png" },
      content: "Chào mọi người, hôm nay thời tiết thật đẹp! 🌞",
      image: "/post1.jpg",
      time: "3 phút trước"
    },
    {
      user: { name: "Nguyễn Văn B", avatar: "/avatar2.png" },
      content: "Vừa tham gia một workshop về ReactJS rất thú vị 💻",
      image: "",
      time: "10 phút trước"
    }
  ];

  const suggestions = [
    { name: "Lê Minh Tuấn", avatar: "/avatar3.png" },
    { name: "Phạm Thảo", avatar: "/avatar4.png" },
    { name: "Hoàng Mạnh", avatar: "/avatar5.png" },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen dark:bg-black">
      <main className="max-w-5xl mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Suggestions */}
        <aside className="md:block hidden">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-xl shadow sticky top-28">
            <div className="font-bold text-lg mb-4">Gợi ý kết bạn</div>
            {suggestions.map((friend, idx) =>
              <SuggestFriendCard key={idx} {...friend} />
            )}
            <button className="mt-3 w-full px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium text-sm transition">
              Xem thêm
            </button>
          </div>
        </aside>

        {/* Center: Feed */}
        <section className="md:col-span-2">
          {/* Post creation (dummy, not functional) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow px-6 py-5 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <img src="/avatar1.png" className="w-10 h-10 rounded-full object-cover border" alt="user" />
              <input
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full outline-none text-zinc-800 dark:text-zinc-100"
                placeholder="Bạn đang nghĩ gì?"
                disabled
              />
            </div>
            <div className="flex gap-6 justify-end text-xs">
              <button className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:text-blue-600">
                <span>🖼️</span> Ảnh/video
              </button>
              <button className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:text-blue-600">
                <span>😊</span> Cảm xúc
              </button>
            </div>
          </div>
          {/* Post List */}
          {posts.map((post, idx) => (
            <Post key={idx} {...post} />
          ))}
          {/* Feed End */}
        </section>
      </main>
    </div>
  );
}
