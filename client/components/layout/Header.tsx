"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authLogout } from "@/services/auth";
import { useDispatch } from "react-redux";

// Dropdown component for profile/messages/notifications
function Dropdown({
    open,
    setOpen,
    children,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, setOpen]);
    if (!open) return null;
    return (
        <div
            ref={ref}
            style={{
                right: 0,
                left: "auto",
                top: "4rem",
                marginTop: 0,
            }}
            className="absolute w-72 bg-white dark:bg-zinc-900 shadow-xl rounded-xl z-30 p-2 border border-zinc-100 dark:border-zinc-800"
        >
            {children}
        </div>
    );
}

const menuItems = [
    {
        href: "/home",
        label: "Trang chủ",
    },
    {
        href: "/friends",
        label: "Bạn bè",
    },
    {
        href: "/profile",
        label: "Cá nhân",
    },
];

export function HEADER_HEIGHT() {
    return "4rem";
}

export default function HeaderWithSpacer() {
    return (
        <>
            <Header />
            <div style={{ height: HEADER_HEIGHT() }} aria-hidden="true" />
        </>
    );
}

function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useDispatch();

    const [openNotif, setOpenNotif] = useState(false);
    const [openMsg, setOpenMsg] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);

    // For input animation
    const [searchHasFocus, setSearchHasFocus] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    // Dummy notifications/messages data
    const notifications = [
        { id: 1, content: "Bạn có 1 lời mời kết bạn mới", time: "2 phút trước" },
        { id: 2, content: "Bài viết của bạn vừa được thích!", time: "10 phút trước" },
    ];
    const messages = [
        { id: 1, from: "Mai Lan", content: "Chào bạn!", time: "Vừa xong", avatar: "/avatar1.png" },
        { id: 2, from: "Nguyễn Quốc", content: "Tối nay rảnh không?", time: "15 phút trước", avatar: "/avatar2.png" },
    ];

    // For search input expand on focus or when have text
    const searchExpanded = searchHasFocus || !!searchValue;

    // Determine if search should be fully expanded & no padding (focus or has value)
    const searchButtonFull = searchHasFocus || !!searchValue;

    // Đảm bảo header luôn cố định (không bị đẩy do thanh scroll) bằng cách dùng position: 'fixed' và width: '100vw'
    return (
        <header
            className="fixed top-0 left-0 bg-white dark:bg-zinc-900 shadow-sm z-30 border-b border-zinc-100 dark:border-zinc-800 h-16 flex items-stretch"
            style={{
                width: "100vw",
                right: 0,
            }}
        >
            <div className="w-full h-full flex px-4">
                <div className="flex flex-row w-full h-full items-stretch justify-between">
                    {/* Left: Logo & Search */}
                    <div className="flex items-center gap-3 min-w-0 h-full flex-1">
                        <button
                            type="button"
                            onClick={() => router.push("/home")}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-300 dark:from-blue-400 dark:to-blue-600 shadow-md border-[2px] border-white dark:border-zinc-800 shrink-0 cursor-pointer"
                            style={{ marginRight: "0.5rem" }}
                            aria-label="Chuyển về trang chủ"
                        >
                            <span className="select-none text-white text-2xl font-bold">C</span>
                        </button>
                        {/* Search input does NOT push the center menu to the right */}
                        <div
                            style={{
                                width: searchExpanded ? "18rem" : "11rem",
                                transition: "width 0.3s",
                                minWidth: 0,
                            }}
                        >
                            <form
                                className={`
                group relative flex items-center transition-all duration-300
                h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full border
                border-[#3B3D3E] shadow-inner
              `}
                                style={{ minWidth: 0, width: "100%" }}
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <input
                                    type="text"
                                    value={searchValue}
                                    onFocus={() => setSearchHasFocus(true)}
                                    onBlur={() => setSearchHasFocus(false)}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder="Tìm kiếm..."
                                    className={`
                  pl-4 ${searchButtonFull ? "py-0" : "py-1.5"} rounded-full bg-transparent
                  text-sm focus:outline-none transition-all duration-200 
                  w-full h-full
                  text-zinc-900 dark:text-zinc-100
                  cursor-pointer focus:cursor-text
                `}
                                    // `cursor-pointer` on input, and becomes text on focus (focus:cursor-text)
                                    style={{
                                        background: "none",
                                        paddingRight: 0,
                                        ...(searchButtonFull
                                            ? {
                                                paddingTop: 0,
                                                paddingBottom: 0,
                                                height: "2.5rem",
                                            }
                                            : {}),
                                    }}
                                />
                                <button
                                    type="submit"
                                    className={`
                  absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center 
                  text-white rounded-full transition cursor-pointer
                `}
                                    tabIndex={-1}
                                    // Added cursor-pointer
                                    style={{
                                        background: "#18181B",
                                        transition: "background 0.2s",
                                        padding: searchButtonFull ? 0 : undefined,
                                        width: "40px",
                                        height: "40px",
                                        minWidth: "40px",
                                        minHeight: "40px",
                                        border: "1.5px solid #3B3D3E",
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = "#2563eb";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = "#18181B";
                                    }}
                                >
                                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                                        <circle cx="9.5" cy="9.5" r="7" stroke="currentColor" strokeWidth="2" />
                                        <path d="M16.5 16.5L13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Center: Menu - border bottom equal for each menu item (~25% width), underline longer than text */}
                    <nav className="flex items-center justify-center h-full flex-[0_0_33.333%] min-w-0 px-6">
                        <ul className="flex w-full justify-between items-stretch h-full gap-0">
                            {menuItems.map((item, idx) => {
                                const active = pathname.startsWith(item.href);

                                return (
                                    <li
                                        key={item.href}
                                        className="h-full flex items-stretch"
                                        style={{
                                            width: "25%",
                                            minWidth: "90px", // Prevent too small on mobile
                                        }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={`
                      flex flex-col items-center justify-center relative w-full h-full text-base font-bold transition
                      ${active ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-200"}
                      hover:text-blue-600 dark:hover:text-blue-300
                    `}
                                            style={{
                                                height: "100%",
                                                textAlign: "center",
                                                width: "100%",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                display: "flex",
                                            }}
                                        >
                                            <span className="flex-1 flex items-center justify-center px-2 relative z-10 h-full">
                                                {item.label}
                                            </span>
                                            {/* underline equal for all menu, longer than label */}
                                            <span
                                                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-xl transition-all duration-300"
                                                style={{
                                                    marginTop: 0,
                                                    height: active ? 4 : 0,
                                                    background: active
                                                        ? "linear-gradient(to right, #2563eb, #60a5fa)"
                                                        : undefined,
                                                    width: "calc(100% + 20px)",
                                                    maxWidth: "140px",
                                                    minWidth: "44px",
                                                    alignSelf: "center",
                                                    opacity: active ? 1 : 0,
                                                    transition: "height 0.2s, opacity 0.2s",
                                                }}
                                            />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 h-full flex-1 justify-end min-w-0">
                        {/* Notification bell */}
                        <div className="relative flex items-center h-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setOpenNotif((o) => !o);
                                    setOpenMsg(false);
                                    setOpenProfile(false);
                                }}
                                className={`
                w-12 h-12 flex items-center justify-center rounded-full border
                transition cursor-pointer
                ${openNotif ? "bg-blue-600 border-blue-600" : "bg-zinc-900 border-[#3B3D3E] dark:bg-zinc-900"}
              `}
                                // Added cursor-pointer
                                style={{ marginTop: "auto", marginBottom: "auto" }}
                            >
                                <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
                                    <path
                                        d="M11 20a2.25 2.25 0 0 1-2.25-2.25h4.5A2.25 2.25 0 0 1 11 20zM18.5 16v-6a7.5 7.5 0 0 0-15 0v6l-1.5 1.5v.5h18v-.5L18.5 16z"
                                        fill={openNotif ? "#fff" : "#fff"}
                                        stroke={openNotif ? "#fff" : "#fff"}
                                        strokeWidth="1.2"
                                    />
                                </svg>
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                            </button>
                            <Dropdown open={openNotif} setOpen={setOpenNotif}>
                                <div className="font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Thông báo</div>
                                <ul>
                                    {notifications.length === 0 && (
                                        <li className="py-3 text-center text-zinc-500">Không có thông báo mới</li>
                                    )}
                                    {notifications.map((n) => (
                                        <li key={n.id} className="py-2 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                                            <div className="text-sm text-zinc-800 dark:text-zinc-200">{n.content}</div>
                                            <div className="text-xs text-zinc-400 mt-0.5">{n.time}</div>
                                        </li>
                                    ))}
                                </ul>
                            </Dropdown>
                        </div>

                        {/* Message */}
                        <div className="relative flex items-center h-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setOpenMsg((o) => !o);
                                    setOpenNotif(false);
                                    setOpenProfile(false);
                                }}
                                className={`
                w-12 h-12 flex items-center justify-center rounded-full border
                transition cursor-pointer
                ${openMsg ? "bg-blue-600 border-blue-600" : "bg-zinc-900 border-[#3B3D3E] dark:bg-zinc-900"}
              `}
                                // Added cursor-pointer
                                style={{ marginTop: "auto", marginBottom: "auto" }}
                            >
                                <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
                                    <path
                                        d="M2 6.857C2 5.832 2.832 5 3.857 5h14.286C19.168 5 20 5.832 20 6.857v8.286C20 16.168 19.168 17 18.143 17H6l-4 4v-4.143C2 16.168 2 15.143 2 15.143V6.857z"
                                        fill={openMsg ? "#fff" : "#fff"}
                                        stroke={openMsg ? "#fff" : "#fff"}
                                        strokeWidth="1.2"
                                    />
                                </svg>
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                            </button>
                            <Dropdown open={openMsg} setOpen={setOpenMsg}>
                                <div className="font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Tin nhắn</div>
                                <ul>
                                    {messages.length === 0 && (
                                        <li className="py-3 text-center text-zinc-500">Chưa có tin nhắn</li>
                                    )}
                                    {messages.map((m) => (
                                        <li
                                            key={m.id}
                                            className="flex items-center gap-2 py-2 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        >
                                            <img
                                                src={m.avatar}
                                                alt={m.from}
                                                className="w-8 h-8 rounded-full object-cover border"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate text-zinc-900 dark:text-zinc-100">
                                                    {m.from}
                                                </div>
                                                <div className="text-xs truncate text-zinc-500 dark:text-zinc-400">
                                                    {m.content}
                                                </div>
                                            </div>
                                            <span className="text-xs text-zinc-400 ml-1">{m.time}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Dropdown>
                        </div>

                        {/* Avatar dropdown */}
                        <div className="relative flex items-center h-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setOpenProfile((o) => !o);
                                    setOpenNotif(false);
                                    setOpenMsg(false);
                                }}
                                className="w-12 h-12 flex items-center justify-center rounded-full hover:ring-2 ring-blue-500 transition relative cursor-pointer"
                                // Added cursor-pointer
                                style={{
                                    position: "relative",
                                    marginTop: "auto",
                                    marginBottom: "auto",
                                }}
                            >
                                {/* Đổi avatar to bằng mess (w-12 h-12) */}
                                <span className="relative w-12 h-12 flex items-center justify-center">
                                    <img
                                        src="/avatar1.png"
                                        alt="User"
                                        className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                    />
                                    {/* Arrow Down moved to bottom-right in the circle */}
                                    <span
                                        className="absolute right-0 bottom-0"
                                        style={{
                                            pointerEvents: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 3,
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" className="text-zinc-500 dark:text-zinc-300">
                                            <circle cx="9" cy="9" r="8" fill="white" className="dark:fill-zinc-800" />
                                            <path d="M9 12l3-4H6l3 4z" fill="currentColor" />
                                        </svg>
                                    </span>
                                </span>
                            </button>
                            <Dropdown open={openProfile} setOpen={setOpenProfile}>
                                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                    <img
                                        src="/avatar1.png"
                                        alt="User"
                                        className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            Trần Thị Lan
                                        </div>
                                        <div className="text-xs text-zinc-400">
                                            lan.tran@email.com
                                        </div>
                                    </div>
                                </div>
                                <ul className="py-1">
                                    <li>
                                        <Link
                                            href="/profile"
                                            onClick={() => setOpenProfile(false)}
                                            className="block w-full px-4 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left text-zinc-800 dark:text-zinc-200"
                                        >
                                            Trang cá nhân
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            className="block w-full px-4 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left text-red-600"
                                            onClick={() => {
                                                setOpenProfile(false);
                                                authLogout(dispatch, router);
                                            }}
                                        >
                                            Đăng xuất
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
