"use client";
import React, { useState } from "react";
import Overview from "./tabs/Overview";
import Contact from "./tabs/Contact";
import Events from "./tabs/Events";

interface InformationProps {
  userId?: string;
}

export default function Information({ userId }: InformationProps) {
  const [aboutTab, setAboutTab] = useState("overview");

  // Contact Information
  // Email
  const [email, setEmail] = useState("");
  const [editEmail, setEditEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Phone
  const [phone, setPhone] = useState("");
  const [editPhone, setEditPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  // Website
  const [website, setWebsite] = useState("");
  const [editWebsite, setEditWebsite] = useState(false);
  const [websiteInput, setWebsiteInput] = useState("");

  // Events
  const [events, setEvents] = useState<Array<{ id: string; event: string; date: string }>>([]);

  return (
    <div className="flex w-full">
      {/* Left menu */}
      <div className="w-[30%] pr-7 flex gap-2">
        <div className="flex flex-1 flex-col space-y-2">
          <button
            className={`py-2 px-4 rounded text-left ${
              aboutTab === "overview"
                ? "bg-[#3B3D3E] text-[#58A2F7] font-semibold rounded-lg"
                : "text-[#b0b3b8] hover:bg-[#3B3D3E] hover:text-white rounded-lg"
            }`}
            onClick={() => setAboutTab("overview")}
          >
            Tổng quan
          </button>
          <button
            className={`py-2 px-4 rounded text-left ${
              aboutTab === "contact"
                ? "bg-[#3B3D3E] text-[#58A2F7] font-semibold rounded-lg"
                : "text-[#b0b3b8] hover:bg-[#3B3D3E] hover:text-white rounded-lg"
            }`}
            onClick={() => setAboutTab("contact")}
          >
            Thông tin liên hệ
          </button>
          <button
            className={`py-2 px-4 rounded text-left ${
              aboutTab === "events"
                ? "bg-[#3B3D3E] text-[#58A2F7] font-semibold rounded-lg"
                : "text-[#b0b3b8] hover:bg-[#3B3D3E] hover:text-white rounded-lg"
            }`}
            onClick={() => setAboutTab("events")}
          >
            Sự kiện trong đời
          </button>
        </div>
        <div className="w-px h-full bg-[#64676B]"></div>
      </div>
      {/* Right content */}
      <div className="w-[70%] pl-7">
        {aboutTab === "overview" && (
          <Overview userId={userId} />
        )}
        {aboutTab === "contact" && (
          <Contact
            // Email states
            email={email}
            setEmail={setEmail}
            editEmail={editEmail}
            setEditEmail={setEditEmail}
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            // Phone states
            phone={phone}
            setPhone={setPhone}
            editPhone={editPhone}
            setEditPhone={setEditPhone}
            phoneInput={phoneInput}
            setPhoneInput={setPhoneInput}
            // Website states
            website={website}
            setWebsite={setWebsite}
            editWebsite={editWebsite}
            setEditWebsite={setEditWebsite}
            websiteInput={websiteInput}
            setWebsiteInput={setWebsiteInput}
            // Pass userId
            userId={userId}
          />
        )}
        {aboutTab === "events" && (
          <Events events={events} setEvents={setEvents} userId={userId} />
        )}
      </div>
    </div>
  );
}
