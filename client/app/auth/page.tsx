"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiRegister as authRegister } from "@/api/auth.api";
import { authLogin } from '@/services/auth'
import { toast } from "react-toastify";
import { AppDispatch } from "@/store";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<{ left: string; width?: string; transition?: string }>({ left: "0%" });
  const [isKeepLogin, setIsKeepLogin] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); // State để lưu trạng thái đồng ý điều khoản
  const tabsRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // For moving animated indicator when switching tab
  function handleSwitchMode(newMode: "login" | "register") {
    setMode(newMode);
    if (tabsRef.current) {
      const children = tabsRef.current.children;
      const tabIdx = newMode === "login" ? 0 : 1;
      const tab = children[tabIdx] as HTMLElement;
      if (tab) {
        setTabIndicatorStyle({
          left: `${tab.offsetLeft}px`,
          width: `${tab.offsetWidth}px`,
          transition: "left 0.35s cubic-bezier(.5,1.6,.35,.95),width 0.3s"
        });
      }
    }
    // Reset agree checkbox when switching mode
    setIsAgreed(false);
  }

  // Set indicator size/position on mount/update
  React.useEffect(() => {
    if (tabsRef.current) {
      const children = tabsRef.current.children;
      const tabIdx = mode === "login" ? 0 : 1;
      const tab = children[tabIdx] as HTMLElement;
      if (tab) {
        setTabIndicatorStyle({
          left: `${tab.offsetLeft}px`,
          width: `${tab.offsetWidth}px`,
          transition:
            mode === "login" || mode === "register"
              ? "left 0.35s cubic-bezier(.5,1.6,.35,.95),width 0.3s"
              : undefined
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tabsRef.current]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittingLogin = mode === "login";
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (submittingLogin) {
      const email = String(formData.get("email") || "");
      const password = String(formData.get("password") || "");

      if (!email || !password) {
        toast.warn("Vui lòng nhập email và mật khẩu");
        return;
      }

      // Only pass allowed fields for login
      authLogin(dispatch, { email, password, isKeepLogin: String(isKeepLogin) })
        .then((data) => {
          router.replace("/home")
          console.log("Login response:", data);
        })
        .catch((error) => {
          const serverError = (error && error.response && error.response.data) || error;
          console.error("Login error:", serverError);
        });
    } else {
      // Đăng ký

      if (!isAgreed) {
        toast.warn("Bạn phải đồng ý với Điều khoản & Chính sách bảo mật để tiếp tục");
        return;
      }

      const email = String(formData.get("email") || "");
      const password = String(formData.get("password") || "");
      const rePassword = String(formData.get("confirmPassword") || "");
      const name = String(formData.get("fullName") || "");

      if (!email || !password || !rePassword || !name) {
        toast.warn("Vui lòng nhập đầy đủ thông tin");
        return;
      }
      if (password !== rePassword) {
        toast.warn("Mật khẩu xác nhận không khớp");
        return;
      }

      authRegister({ email, password, rePassword, name })
        .then((data) => {
          toast.success("Đăng ký thành công!");
          handleSwitchMode("login");
        })
        .catch((error) => {
          const serverError = (error && error.response && error.response.data) || error;
          toast.error(`Có lỗi xảy ra: ${serverError.message}`);
        });
    }
  }

  const isLogin = mode === "login";
  const FORM_ANIMATION = "transition-all duration-500 ease-in-out will-change-transform";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <style>
        {`
        .tab-indicator {
          position: absolute;
          top: 0.25rem; bottom: 0.25rem;
          background: #fff;
          border-radius: 9999px;
          z-index: 0;
          box-shadow: 0 1.5px 8px rgba(0,0,0,0.05);
          pointer-events: none;
          transition: left 0.35s cubic-bezier(.5,1.6,.35,.95),width 0.3s;
        }
        .tab-btn { z-index: 10; position: relative; cursor: pointer; }
        .switch-link { cursor: pointer; }
        `}
      </style>
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5 dark:bg-zinc-900">
        <div
          ref={tabsRef}
          className="mb-6 relative grid grid-cols-2 rounded-full bg-zinc-100 p-1 text-sm dark:bg-zinc-800"
          style={{ position: "relative", userSelect: "none" }}
        >
          {/* Animated indicator */}
          <div
            className="tab-indicator"
            style={{
              ...tabIndicatorStyle,
              height: "calc(100% - 0.5rem)",
              minWidth: 56,
              background: "var(--tw-bg-opacity,1) #fff",
            }}
          ></div>
          <button
            type="button"
            tabIndex={0}
            onClick={() => handleSwitchMode("login")}
            className={`tab-btn rounded-full px-4 py-2 font-medium transition-colors focus:outline-none ${isLogin
              ? "bg-white text-black shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            style={{ cursor: "pointer" }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            tabIndex={0}
            onClick={() => handleSwitchMode("register")}
            className={`tab-btn rounded-full px-4 py-2 font-medium transition-colors focus:outline-none ${!isLogin
              ? "bg-white text-black shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            style={{ cursor: "pointer" }}
          >
            Đăng ký
          </button>
        </div>

        {/* Animated swap for form content */}
        <div
          className={`relative overflow-x-hidden h-[90px]`}
        >
          <div
            className={`absolute top-0 left-0 w-full transition-opacity duration-400 ${FORM_ANIMATION} ${isLogin ? "opacity-100 translate-x-0 z-10" : "opacity-0 -translate-x-16 pointer-events-none z-0"
              }`}
          >
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Chào mừng trở lại
            </h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Đăng nhập để tiếp tục.
            </p>
          </div>
          <div
            className={`absolute top-0 left-0 w-full transition-opacity duration-400 ${FORM_ANIMATION} ${!isLogin ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-16 pointer-events-none z-0"
              }`}
          >
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Tạo tài khoản mới
            </h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Điền thông tin bên dưới để bắt đầu.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-4 relative w-full ${FORM_ANIMATION}`}
        >
          {/* Slide in/out for fields */}
          <div className={`transition-all duration-500 ${isLogin ? "opacity-0 -translate-x-8 absolute pointer-events-none" : "opacity-100 translate-x-0 relative"}`}>
            {!isLogin && (
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          <div className={`transition-all duration-400 ${isLogin ? "delay-75" : ""}`}>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className={`transition-all duration-400`}>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={"Nhập mật khẩu"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className={`transition-all duration-500 ${isLogin ? "opacity-0 -translate-x-8 absolute pointer-events-none" : "opacity-100 translate-x-0 relative"}`}>
            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          <div className={`transition-all duration-500`}>
            {isLogin ? (
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    className="size-4 rounded border-zinc-300 text-black dark:border-zinc-700"
                    checked={isKeepLogin}
                    onChange={e => setIsKeepLogin(e.target.checked)}
                    name="keepLogin"
                  />
                  Ghi nhớ đăng nhập
                </label>
                <button
                  type="button"
                  className="text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                  style={{ cursor: "pointer" }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            ) : (
              <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-zinc-300 text-black dark:border-zinc-700"
                  checked={isAgreed}
                  onChange={e => setIsAgreed(e.target.checked)}
                  name="agreeTerms"
                />
                Tôi đồng ý với Điều khoản & Chính sách bảo mật
              </label>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#383838] dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            style={{ cursor: "pointer" }}
          >
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-700 dark:text-zinc-300">
          {isLogin ? (
            <span>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("register")}
                className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50 switch-link"
                style={{ cursor: "pointer" }}
              >
                Đăng ký ngay
              </button>
            </span>
          ) : (
            <span>
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
                className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50 switch-link"
                style={{ cursor: "pointer" }}
              >
                Đăng nhập
              </button>
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
