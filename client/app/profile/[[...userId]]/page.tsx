
"use client";
import React, { useState, useRef, useEffect } from "react";
import Post from "@/components/ui/Post";
import AlterProfilePopup from "../menu/alterProfilePopup";
import { useSelector, useDispatch } from "react-redux";
import { getCloudinaryImageLink, getCloudinaryCoverLink } from "@/helper/croppedImageHelper";
import ShowImage from "@/components/ui/ShowImage";
import { apiChangeUsername, apiGetUserProfile } from "@/api/profile.api";
import Information from "../menu/Information";
import { useParams } from "next/navigation";

type ImageObj = {
  file_type?: string;
  file_url?: string;
  order_index?: number;
};

function getRemainingDays(usernameChangedDateRaw?: string | number | Date): number {
  if (!usernameChangedDateRaw) return 0;
  const lastChanged = new Date(usernameChangedDateRaw).getTime();
  if (isNaN(lastChanged)) return 0;
  const now = Date.now();
  const millisInDay = 24 * 60 * 60 * 1000;
  const diff = now - lastChanged;
  const daysSinceChange = Math.floor(diff / millisInDay);
  const remaining = 30 - daysSinceChange;
  return remaining > 0 ? remaining : 0;
}

export default function ProfilePage() {
  // Lấy userId từ param
  const params = useParams();
  let userId: string | undefined = undefined;
  if (params && (params as any).userId) {
    if (Array.isArray((params as any).userId) && (params as any).userId.length > 0) {
      userId = (params as any).userId[0];
    } else if (typeof (params as any).userId === "string") {
      userId = (params as any).userId;
    }
  }

  const dispatch = useDispatch();
  const tabMenuRef = useRef<HTMLDivElement | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showStickyProfile, setShowStickyProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFlashing, setIsFlashing] = useState("");

  // Modal for ShowImage
  const [modalData, setModalData] = useState<{
    images?: ImageObj[];
    initialIndex?: number;
    avatar?: string;
    avatarCroppedArea?: any;
    name?: string;
    username?: string;
    createdAt?: string | number | Date;
    type?: "avatar" | "cover";
  } | null>(null);

  // ===================
  // PROFILE STATE HANDLING
  // ===================

  // Nếu userId: dùng apiGetUserProfile. Ngược lại: dùng redux.
  const reduxUser = useSelector((state: any) => state.user);
  const [userProfile, setUserProfile] = useState<any>(userId ? null : reduxUser);

  // Loading + error cho mode khac user (userId)
  const [loadingProfile, setLoadingProfile] = useState(!!userId);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      setLoadingProfile(true);
      apiGetUserProfile(userId)
        .then((data) => {
          setUserProfile(data);
          setLoadingProfile(false);
          setProfileError(null);
        })
        .catch((err) => {
          setProfileError(
            err?.response?.data?.message ||
              err?.message ||
              "Không thể lấy thông tin user"
          );
          setLoadingProfile(false);
        });
    } else {
      setUserProfile(reduxUser);
    }
  }, [userId, reduxUser]);

  // Xử lý sync/logic cho chỉnh sửa username. Chỉ dùng khi không có userId.
  // Khi đang xem profile của chính mình, cho phép sửa username.
  const [localUsername, setLocalUsername] = useState(
    userId ? "" : reduxUser.profile?.username || ""
  );
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(
    userId ? "" : reduxUser.profile?.username || ""
  );
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      const newUsername = reduxUser.profile?.username || "";
      setLocalUsername(newUsername);
      setUsernameInput(newUsername);
    }
  }, [reduxUser.profile?.username, userId]);

  const handleSaveUsername = async () => {
    setUsernameError(null);
    if (!usernameInput || usernameInput === localUsername) {
      setEditingUsername(false);
      return;
    }
    setUsernameSaving(true);
    try {
      await apiChangeUsername({ username: usernameInput });
      setLocalUsername(usernameInput);
      setEditingUsername(false);
    } catch (err: any) {
      setUsernameError(
        err?.response?.data?.message ||
        err?.message ||
        "Đã xảy ra lỗi khi cập nhật username"
      );
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleCancelUsername = () => {
    setUsernameInput(localUsername);
    setEditingUsername(false);
    setUsernameError(null);
  };

  const handleClick = (id: string) => {
    setIsFlashing(id);
    setTimeout(() => setIsFlashing(""), 100);
  };

  // ===================
  // EXTRACTED DATA
  // ===================
  // Luôn lấy dữ liệu từ userProfile (dù là redux hay API)
  const bio = userProfile?.bio || {};
  const profile = userProfile?.profile || {};

  const displayName = profile.name || "";
  const displayAvatar = bio.avatar || "";
  const displayAvatarCroppedArea = bio.avatarCroppedArea || null;
  const avatar40x40 = getCloudinaryImageLink(
    displayAvatar,
    displayAvatarCroppedArea,
    40,
    { rounded: true }
  );
  const avatar190x190 = getCloudinaryImageLink(
    displayAvatar,
    displayAvatarCroppedArea,
    190,
    { rounded: true }
  );

  const displayCover = bio.cover || "";
  const displayCoverCroppedArea = bio.coverCroppedArea || null;
  const cover1233x460 = getCloudinaryCoverLink(
    displayCover,
    displayCoverCroppedArea,
    1233,
    460
  );
  const coverBgColor = [36, 37, 40];
  const coverBgGradient = `radial-gradient(circle at center, rgb(${coverBgColor[0]},${coverBgColor[1]},${coverBgColor[2]}), #232425 70%)`;

  const displayCreatedAt = userProfile?.createdAt || userProfile?.created_at || "";
  const displayDescription = bio.description || "";

  // Username Lock
  const usernameChangedDate = profile.usernameChangedDate;
  const usernameDaysRemaining = getRemainingDays(usernameChangedDate);
  const canChangeUsername = usernameDaysRemaining <= 0;
  const displayUsername =
    profile.username ||
    (!userId ? localUsername : "") ||
    "";

  // Modal for ShowImage: Lấy từ dữ liệu phối hợp API/redux tuỳ context
  const handleShowImageModal = (type: "avatar" | "cover") => {
    if (type === "avatar") {
      setModalData({
        images: [
          {
            file_type: "image",
            file_url: displayAvatar,
            order_index: 0,
          },
        ],
        initialIndex: 0,
        avatar: displayAvatar,
        avatarCroppedArea: displayAvatarCroppedArea,
        name: displayName,
        username: displayUsername,
        createdAt: displayCreatedAt,
        type: "avatar",
      });
    } else {
      setModalData({
        images: [
          {
            file_type: "image",
            file_url: displayCover,
            order_index: 0,
          },
        ],
        initialIndex: 0,
        avatar: displayAvatar,
        avatarCroppedArea: displayAvatarCroppedArea,
        name: displayName,
        username: displayUsername,
        createdAt: displayCreatedAt,
        type: "cover",
      });
    }
  };
  const handleCloseModal = () => setModalData(null);

  // Sticky tab bar
  useEffect(() => {
    const handleScroll = () => {
      if (!tabMenuRef.current) return;
      const tabMenuRect = tabMenuRef.current.getBoundingClientRect();
      if (tabMenuRect.top <= 0) {
        setShowStickyProfile(true);
      } else {
        setShowStickyProfile(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ===================
  // RENDER LOGIC
  // ===================

  if (loadingProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-[#252728] items-center justify-center">
        <div className="text-white text-xl">Đang tải thông tin tài khoản...</div>
      </div>
    );
  }
  if (profileError) {
    return (
      <div className="flex flex-col min-h-screen bg-[#252728] items-center justify-center">
        <div className="text-red-400 text-xl">{profileError}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#252728]">
      {/* Popup chỉnh sửa hồ sơ - Ẩn khi có userId*/}
      {!userId && (
        <AlterProfilePopup
          showPopup={showPopup}
          setShowPopup={setShowPopup}
          avatar={displayAvatar}
          avatarCroppedStat={bio.avatarCroppedStat || null}
          avatarCroppedArea={displayAvatarCroppedArea}
          cover={displayCover}
          coverCroppedStat={bio.coverCroppedStat || null}
          coverCroppedArea={displayCoverCroppedArea}
          description={displayDescription}
          dispatch={dispatch}
          getCloudinaryCoverLink={getCloudinaryCoverLink}
          getCloudinaryImageLink={getCloudinaryImageLink}
        />
      )}

      {/* ShowImage Modal */}
      {modalData && (
        <ShowImage
          images={modalData.images}
          initialIndex={modalData.initialIndex}
          onClose={handleCloseModal}
          avatar={modalData.avatar}
          avatarCroppedArea={modalData.avatarCroppedArea}
          name={modalData.name}
          username={modalData.username}
          createdAt={modalData.createdAt}
        />
      )}

      {/* Sticky avatar + name */}
      {showStickyProfile && (
        <div
          className="z-50 sticky top-[55px] left-0 w-full flex justify-center bg-[#232425] border-b border-[#333] shadow"
          style={{ minHeight: 60, cursor: "pointer" }}
        >
          <div className="flex items-center gap-3 w-[60%] py-2">
            <div
              className="w-10 h-10 rounded-full bg-gray-600"
              style={{
                backgroundImage: `url(${avatar40x40})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            ></div>
            <div className="text-lg text-white font-semibold truncate">
              {displayName || displayUsername || "user"}
            </div>
          </div>
        </div>
      )}

      {/* Body Block */}
      <div className="Body-block flex-1 flex flex-col items-center bg-[#252728]">
        {/* Cover image */}
        <div
          className="w-full flex items-center justify-center"
          style={{
            background: coverBgGradient,
            transition: "background 0.3s",
          }}
        >
          <div
            className={`${isFlashing === "cover" ? "flash" : ""} w-[65%] rounded-b-[10px] cursor-pointer transition duration-200 hover:brightness-110`}
            style={{
              aspectRatio: "2.7/1",
              height: "auto",
              backgroundImage: `url(${cover1233x460})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
            onClick={() => {
              handleClick("cover");
              handleShowImageModal("cover");
            }}
            title="Xem ảnh bìa"
          ></div>
        </div>

        {/* Profile block */}
        <div className="relative w-full flex flex-col items-center">
          <div className="w-[60%] flex flex-row justify-between">
            {/* Avatar and name */}
            <div className="flex gap-4">
              <div className="w-[200px] h-[200px]">
                <div className="absolute -top-[40px] flex items-center justify-center w-[200px] h-[200px] rounded-full bg-[#252728]">
                  <div
                    className={`${isFlashing === "avatar" ? "flash" : ""} w-[190px] h-[190px] rounded-full bg-gray-600 cursor-pointer transition duration-200 hover:brightness-125`}
                    style={{
                      backgroundImage: `url(${avatar190x190})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    onClick={() => {
                      handleClick("avatar");
                      handleShowImageModal("avatar");
                    }}
                    title="Xem ảnh đại diện"
                  ></div>
                </div>
              </div>
              <div className="pt-12 flex flex-col gap-2">
                <div className="text-4xl text-white font-semibold cursor-pointer">
                  {displayName || displayUsername || "user"}
                </div>
                {/* Username row: Ẩn hết các nút chỉnh sửa nếu đang xem profile người khác */}
                <div className="flex items-center text-xl text-white gap-2">
                  {!userId ? (
                    !editingUsername ? (
                      <>
                        <span>
                          @{displayUsername}
                        </span>
                        <button
                          className="ml-2 px-2 py-1 rounded bg-[#0866FF] text-white hover:bg-[#298EFF] text-base transition disabled:opacity-60 disabled:bg-[#555]"
                          onClick={() => setEditingUsername(true)}
                          aria-label="Sửa username"
                          title={
                            canChangeUsername
                              ? "Sửa username"
                              : `Chờ ${usernameDaysRemaining} ngày nữa để thay đổi`
                          }
                          disabled={!canChangeUsername}
                        >
                          Sửa
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          className="bg-[#232425] text-white border border-[#525356] px-2 py-1 rounded outline-none w-[170px]"
                          value={usernameInput}
                          maxLength={30}
                          onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ""))}
                          autoFocus
                          disabled={usernameSaving}
                        />
                        <button
                          className="ml-2 px-2 py-1 rounded bg-[#0866FF] text-white hover:bg-[#298EFF] transition"
                          onClick={handleSaveUsername}
                          disabled={usernameSaving}
                        >
                          {usernameSaving ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button
                          className="ml-1 px-2 py-1 rounded bg-[#323334] text-white hover:bg-[#444] transition"
                          onClick={handleCancelUsername}
                          disabled={usernameSaving}
                        >
                          Huỷ
                        </button>
                        {usernameError && (
                          <span className="ml-2 text-red-400 text-base">{usernameError}</span>
                        )}
                      </>
                    )
                  ) : (
                    // Hiển thị chỉ username, không nút chỉnh sửa
                    <span>@{displayUsername}</span>
                  )}
                </div>
              </div>
            </div>
            {/* Right side: Profile action button */}
            {!userId ? (
              <div className="pt-16">
                <button
                  className="h-[40px] w-[115px] bg-[#3B3D3E] hover:bg-[#4F5152] text-[white] rounded-[8px]"
                  onClick={() => setShowPopup(true)}
                >
                  <span className="mr-2">✏️</span> Chỉnh sửa
                </button>
              </div>
            ) : (
              <div className="pt-16">
                <button
                  className="h-[40px] w-[130px] bg-[#0866FF] hover:bg-[#298EFF] text-white rounded-[8px] text-base font-semibold flex items-center justify-center transition"
                  // onClick logic for Kết bạn sẽ bổ sung sau, tạm thời là alert
                  onClick={() => alert('Tính năng kết bạn đang phát triển')}
                >
                  <span className="mr-2">➕</span> Kết bạn
                </button>
              </div>
            )}
          </div>

          {/* Decorate line */}
          <div className="relative w-[60%] h-px bg-[#64676B] -mt-[20px]"></div>

          {/* Tab Menu */}
          <div
            className="w-full mt-3 flex flex-col items-center"
            ref={tabMenuRef}
          >
            {/* Tab bar giữ nguyên độ rộng 60% */}
            <div className="w-[60%]">
              <div className="flex gap-2">
                {[
                  { label: "Bài viết", key: "posts" },
                  { label: "Giới thiệu", key: "about" },
                  { label: "Bạn bè", key: "friends" },
                  { label: "Ảnh", key: "photos" },
                ].map((tab, idx) => (
                  <button
                    key={tab.key}
                    className={`py-3 px-6 text-lg font-semibold focus:outline-none rounded-[8px] hover:bg-[#3B3D3E] transition cursor-pointer
                      ${activeTab === tab.key
                        ? "border-b-4 border-[#0866FF] text-[#58A2F7]"
                        : "text-[#b0b3b8] hover:text-white"
                      }
                    `}
                    onClick={() => {
                      setActiveTab(tab.key);
                    }}
                    style={activeTab === tab.key ? {
                      boxShadow: "0 2px 16px 0 #0866ff44",
                      transition: "box-shadow 0.3s cubic-bezier(0.4,0,0.2,1)"
                    } : {}}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Nội dung của Tab hiển thị full width, không giới hạn 60% */}
            <div className="mt-0 w-full bg-[#1C1C1D] rounded-lg min-h-[400px] p-6 flex justify-center">
              <div className="w-full max-w-5xl">
                {activeTab === "posts" && (
                  <Post
                    name={displayName}
                    username={displayUsername}
                    avatar={displayAvatar}
                    avatarCroppedArea={displayAvatarCroppedArea}
                    userId={userId ? userId : undefined}
                    pageType="Profile"
                  />
                )}
                {activeTab === "about" && (
                  <Information userId={userId ? userId : undefined} />
                )}
                {activeTab === "friends" && (
                  <div className="text-white text-center">Danh sách bạn bè</div>
                )}
                {activeTab === "photos" && (
                  <div className="text-white text-center">Thư viện ảnh</div>
                )}
                {activeTab === "groups" && (
                  <div className="text-white">Nội dung Nhóm</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Đã loại bỏ hiệu ứng cho tab hoạt động gần đây */}
    </div>
  );
}

