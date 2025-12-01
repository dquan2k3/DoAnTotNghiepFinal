"use client";
import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  apiChangeEmailContact,
  apiGetContact,
  apiChangePhoneContact,
  apiChangeWebsiteContact,
} from "@/api/profile.api";

interface ContactProps {
  // Email states
  email: string;
  setEmail: (email: string) => void;
  editEmail: boolean;
  setEditEmail: (edit: boolean) => void;
  emailInput: string;
  setEmailInput: (input: string) => void;
  // Phone states
  phone: string;
  setPhone: (phone: string) => void;
  editPhone: boolean;
  setEditPhone: (edit: boolean) => void;
  phoneInput: string;
  setPhoneInput: (input: string) => void;
  // Website states
  website: string;
  setWebsite: (website: string) => void;
  editWebsite: boolean;
  setEditWebsite: (edit: boolean) => void;
  websiteInput: string;
  setWebsiteInput: (input: string) => void;
  // Optional userId for viewing another user's contact info
  userId?: string;
}

export default function Contact(props: ContactProps) {
  const {
    email,
    setEmail,
    editEmail,
    setEditEmail,
    emailInput,
    setEmailInput,
    phone,
    setPhone,
    editPhone,
    setEditPhone,
    phoneInput,
    setPhoneInput,
    website,
    setWebsite,
    editWebsite,
    setEditWebsite,
    websiteInput,
    setWebsiteInput,
    userId
  } = props;

  // Determine if view-only mode (when userId is provided)
  const readOnly = typeof userId === "string" && userId !== "";

  useEffect(() => {
    let isMounted = true;
    // If userId is provided, call apiGetContact(userId), else call apiGetContact()
    const getContact = async () => {
      try {
        let data;
        if (readOnly) {
          data = await apiGetContact(userId);
        } else {
          data = await apiGetContact();
        }
        if (!isMounted) return;
        if (data.success && data.contact) {
          setEmail(data.contact.emailcontact || "");
          setEmailInput(data.contact.emailcontact || "");
          setPhone(data.contact.phone || "");
          setPhoneInput(data.contact.phone || "");
          setWebsite(data.contact.website || "");
          setWebsiteInput(data.contact.website || "");
        }
      } catch (e: any) {
        if (!isMounted) return;
        alert(
          e?.response?.data?.message ||
            e?.message ||
            "Lỗi không xác định khi lấy thông tin liên hệ"
        );
      }
    };
    getContact();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Xác thực email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  // Xác thực số điện thoại
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };
  // Xác thực website
  const isValidWebsite = (website: string) => {
    const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return websiteRegex.test(website);
  };

  // Xử lý cập nhật email
  const handleUpdateEmail = async (email: string) => {
    try {
      const response = await apiChangeEmailContact({ email });
      if (response.success) {
        setEmail(email);
      }
    } catch (err: any) {
      alert(
        "Lỗi cập nhật email: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  };

  // Xử lý cập nhật số điện thoại
  const handleUpdatePhone = async (phone: string) => {
    try {
      const response = await apiChangePhoneContact({ phone });
      if (response.success) {
        setPhone(phone);
      }
    } catch (err: any) {
      alert(
        "Lỗi cập nhật số điện thoại: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  };

  // Xử lý cập nhật website
  const handleUpdateWebsite = async (website: string) => {
    try {
      const response = await apiChangeWebsiteContact({ website });
      if (response.success) {
        setWebsite(website);
      }
    } catch (err: any) {
      alert(
        "Lỗi cập nhật website: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  };

  return (
    <div className="gap-3 flex flex-col">
      <h3 className="text-2xl font-bold -ml-4 text-white w-full">
        Thông tin liên hệ
      </h3>

      {/* Email */}
      <div className="w-full flex flex-row items-center justify-between">
        {!readOnly && editEmail ? (
          <form
            className="flex-1 flex flex-row gap-4 items-center p-2 border border-[#3B3D3E] rounded"
            onSubmit={async (e) => {
              e.preventDefault();
              if (emailInput.trim() !== "" && isValidEmail(emailInput)) {
                await handleUpdateEmail(emailInput);
                setEditEmail(false);
              } else {
                alert("Vui lòng nhập email hợp lệ");
              }
            }}
          >
            <div className="flex flex-col flex-1">
              <label className="text-xs text-white mb-1" htmlFor="contact-email-input">
                Email
              </label>
              <input
                id="contact-email-input"
                type="email"
                className="text-white bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 w-full outline-none text-[16px] focus:border-blue-500"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="example@email.com"
                autoFocus
              />
            </div>
            <div className="flex flex-row gap-2">
              <button
                type="submit"
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7] cursor-pointer"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditEmail(false);
                  setEmailInput(email || "");
                }}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8] cursor-pointer"
                title="Hủy"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1 flex flex-row items-center">
              <span className="text-white text-[17px]">
                Email
                <span className="">:</span>
              </span>
              <span className="text-white text-[17px] pl-1">
                {email || "Chưa đặt"}
              </span>
            </div>
            {!readOnly && (
              <div
                className="w-[36px] h-[36px] flex-shrink-0 text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
                onClick={() => setEditEmail(true)}
                title="Chỉnh sửa"
              >
                <FontAwesomeIcon icon={faPencil} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Số điện thoại */}
      <div className="w-full flex flex-row items-center justify-between">
        {!readOnly && editPhone ? (
          <form
            className="flex-1 flex flex-row gap-4 items-center p-2 border border-[#3B3D3E] rounded"
            onSubmit={async (e) => {
              e.preventDefault();
              if (phoneInput.trim() !== "" && isValidPhone(phoneInput)) {
                await handleUpdatePhone(phoneInput);
                setEditPhone(false);
              } else {
                alert("Vui lòng nhập số điện thoại hợp lệ");
              }
            }}
          >
            <div className="flex flex-col flex-1">
              <label className="text-xs text-white mb-1" htmlFor="contact-phone-input">
                Số điện thoại
              </label>
              <input
                id="contact-phone-input"
                type="tel"
                className="text-white bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 w-full outline-none text-[16px] focus:border-blue-500"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="+84 123 456 789"
                autoFocus
              />
            </div>
            <div className="flex flex-row gap-2">
              <button
                type="submit"
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7] cursor-pointer"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditPhone(false);
                  setPhoneInput(phone || "");
                }}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8] cursor-pointer"
                title="Hủy"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1 flex flex-row items-center">
              <span className="text-white text-[17px]">
                Số điện thoại
                <span className="">:</span>
              </span>
              <span className="text-white text-[17px] ml-1">
                {phone || "Chưa đặt"}
              </span>
            </div>
            {!readOnly && (
              <div
                className="w-[36px] h-[36px] text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
                onClick={() => setEditPhone(true)}
                title="Chỉnh sửa"
              >
                <FontAwesomeIcon icon={faPencil} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Website */}
      <div className="w-full flex flex-row items-center justify-between">
        {!readOnly && editWebsite ? (
          <form
            className="flex-1 flex flex-row gap-4 items-center p-2 border border-[#3B3D3E] rounded"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                websiteInput.trim() !== "" &&
                (websiteInput === "" || isValidWebsite(websiteInput))
              ) {
                await handleUpdateWebsite(websiteInput);
                setEditWebsite(false);
              } else {
                alert("Vui lòng nhập website hợp lệ (ví dụ: example.com)");
              }
            }}
          >
            <div className="flex flex-col flex-1">
              <label className="text-xs text-white mb-1" htmlFor="contact-website-input">
                Website
              </label>
              <input
                id="contact-website-input"
                type="url"
                className="text-white bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 w-full outline-none text-[16px] focus:border-blue-500"
                value={websiteInput}
                onChange={e => setWebsiteInput(e.target.value)}
                placeholder="https://example.com"
                autoFocus
              />
            </div>
            <div className="flex flex-row gap-2">
              <button
                type="submit"
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7] cursor-pointer"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditWebsite(false);
                  setWebsiteInput(website || "");
                }}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8] cursor-pointer"
                title="Hủy"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1 flex flex-row items-center">
              <span className="text-white text-[17px]">
                Website
                <span className="">:</span>
              </span>
              <span className="text-white text-[17px] ml-1">
                {website ? (
                  <a
                    href={
                      website.startsWith("http") ? website : `https://${website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#58A2F7] hover:underline"
                  >
                    {website}
                  </a>
                ) : (
                  "Chưa đặt"
                )}
              </span>
            </div>
            {!readOnly && (
              <div
                className="w-[36px] h-[36px] text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
                onClick={() => setEditWebsite(true)}
                title="Chỉnh sửa"
              >
                <FontAwesomeIcon icon={faPencil} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
