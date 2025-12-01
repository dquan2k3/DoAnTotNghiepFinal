"use client";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  apiChangeBirthDay,
  apiChangeHometown,
  apiChangeLiving,
  apiChangeName,
  apiChangeSchool,
  apiGetInfo,
  apiGetProfile,
} from "@/api/profile.api";

interface OverviewProps {
  userId?: string;
}

export default function Overview({ userId }: OverviewProps) {
  // Name states
  const [name, setName] = useState("");
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Living states
  const [living, setLiving] = useState("");
  const [whenLiving, setWhenLiving] = useState("");
  const [editLiving, setEditLiving] = useState(false);
  const [livingInput, setLivingInput] = useState("");
  const [currentLiving, setCurrentLiving] = useState("");
  const [dateLiving, setDateLiving] = useState("");
  const [privateLiving, setPrivateLiving] = useState("public");
  const [pLiving, setPLiving] = useState("public");

  // Hometown states
  const [hometown, setHometown] = useState("");
  const [editHometown, setEditHometown] = useState(false);
  const [hometownInput, setHometownInput] = useState("");
  const [privateHometown, setPrivateHometown] = useState("public");
  const [pHometown, setPHometown] = useState("public");

  // BirthDay states
  const [birthDay, setBirthDay] = useState("");
  const [editBirthDay, setEditBirthDay] = useState(false);
  const [birthDayInput, setBirthDayInput] = useState("");
  const [privateBirthday, setPrivateBirthday] = useState("public");
  const [pBirthDay, setPBirthDay] = useState("public");

  // WorkSchool states
  const [workSchool, setWorkSchool] = useState("");
  const [editWorkSchool, setEditWorkSchool] = useState(false);
  const [workSchoolInput, setWorkSchoolInput] = useState("");
  const [privateWorkSchool, setPrivateWorkSchool] = useState("public");
  const [pWorkSchool, setPWorkSchool] = useState("public");
  const [graduatedSchool, setGraduatedSchool] = useState(false);

  // Nhận biết chế độ chỉ xem (view-only) khi có userId
  const readOnly = typeof userId === "string" && userId !== "";

  // Fetch profile data
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        let response;
        if (userId) {
          response = await apiGetProfile(userId);
        } else {
          response = await apiGetProfile();
        }
        if (!isMounted) return;

        if (response && response.success && response.profile) {
          const profile = response.profile;

          setName(profile.name || "");
          setNameInput(profile.name || "");

          setLiving(profile.living || "");
          setLivingInput(profile.living || "");
          setCurrentLiving(profile.living || "");
          if (profile.dateliving) {
            const dateStr =
              typeof profile.dateliving === "string"
                ? profile.dateliving.split("T")[0]
                : new Date(profile.dateliving).toISOString().split("T")[0];
            setWhenLiving(dateStr);
            setDateLiving(dateStr);
          } else {
            setWhenLiving("");
            setDateLiving("");
          }
          setPLiving(profile.privateliving || "public");
          setPrivateLiving(profile.privateliving || "public");

          setHometown(profile.hometown || "");
          setHometownInput(profile.hometown || "");
          setPrivateHometown(profile.privatehometown || "public");
          setPHometown(profile.privatehometown || "public");

          if (profile.birthday) {
            const dateStr =
              typeof profile.birthday === "string"
                ? profile.birthday.split("T")[0]
                : new Date(profile.birthday).toISOString().split("T")[0];
            setBirthDay(profile.birthday);
            setBirthDayInput(dateStr);
          } else {
            setBirthDay("");
            setBirthDayInput("");
          }
          setPrivateBirthday(profile.privatebirthday || "public");
          setPBirthDay(profile.privatebirthday || "public");

          setWorkSchool(profile.school || "");
          setWorkSchoolInput(profile.school || "");
          setPrivateWorkSchool(profile.privateSchool || "public");
          setPWorkSchool(profile.privateSchool || "public");
          setGraduatedSchool(!!profile.graduated);
        } else if (userId) {
          // Trường hợp userId và response không có profile, reset các state về rỗng/default
          setName("");
          setNameInput("");
          setLiving("");
          setLivingInput("");
          setCurrentLiving("");
          setWhenLiving("");
          setDateLiving("");
          setPLiving("public");
          setPrivateLiving("public");

          setHometown("");
          setHometownInput("");
          setPrivateHometown("public");
          setPHometown("public");

          setBirthDay("");
          setBirthDayInput("");
          setPrivateBirthday("public");
          setPBirthDay("public");

          setWorkSchool("");
          setWorkSchoolInput("");
          setPrivateWorkSchool("public");
          setPWorkSchool("public");
          setGraduatedSchool(false);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error(error);
        // Nếu có userId và lỗi, reset các state về rỗng/default
        if (userId) {
          setName("");
          setNameInput("");
          setLiving("");
          setLivingInput("");
          setCurrentLiving("");
          setWhenLiving("");
          setDateLiving("");
          setPLiving("public");
          setPrivateLiving("public");

          setHometown("");
          setHometownInput("");
          setPrivateHometown("public");
          setPHometown("public");

          setBirthDay("");
          setBirthDayInput("");
          setPrivateBirthday("public");
          setPBirthDay("public");

          setWorkSchool("");
          setWorkSchoolInput("");
          setPrivateWorkSchool("public");
          setPWorkSchool("public");
          setGraduatedSchool(false);
        }
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Sửa các hàm update để không làm gì trong chế độ readonly
  const handleUpdateName = async (name: string) => {
    if (readOnly) return;
    try {
      await apiChangeName({ name });
      await apiGetInfo();
    } catch (err: any) {
      alert(
        "Lỗi cập nhật tên: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  };

  async function handleUpdateLiving() {
    if (readOnly) return;
    try {
      const response = await apiChangeLiving({
        living: livingInput,
        dateLiving,
        privateLiving,
      });
      if (response.success && response.profile) {
        setLiving(response.profile.living || "");
        setLivingInput(response.profile.living || "");
        if (response.profile.dateliving) {
          const dateStr =
            typeof response.profile.dateliving === "string"
              ? response.profile.dateliving.split("T")[0]
              : new Date(response.profile.dateliving).toISOString().split("T")[0];
          setWhenLiving(dateStr);
          setDateLiving(dateStr);
        }
        setPLiving(response.profile.privateliving || "public");
        setPrivateLiving(response.profile.privateliving || "public");
      }
    } catch (err: any) {
      alert(
        "Lỗi cập nhật nơi ở: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  }

  async function handleUpdateHometown() {
    if (readOnly) return;
    try {
      const response = await apiChangeHometown({
        hometown: hometownInput,
        privateHometown,
      });
      if (response.success && response.profile) {
        setHometown(response.profile.hometown || "");
        setHometownInput(response.profile.hometown || "");
        setPrivateHometown(response.profile.privatehometown || "public");
        setPHometown(response.profile.privatehometown || "public");
      }
    } catch (err: any) {
      alert(
        "Lỗi cập nhật quê quán: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  }

  async function handleUpdateBirthDay() {
    if (readOnly) return;
    try {
      const response = await apiChangeBirthDay({
        birthday: birthDayInput,
        privateBirthday,
      });
      if (response.success && response.profile) {
        setBirthDay(response.profile.birthday || "");
        if (response.profile.birthday) {
          const dateStr =
            typeof response.profile.birthday === "string"
              ? response.profile.birthday.split("T")[0]
              : new Date(response.profile.birthday).toISOString().split("T")[0];
          setBirthDayInput(dateStr);
        }
        setPrivateBirthday(response.profile.privatebirthday || "public");
        setPBirthDay(response.profile.privatebirthday || "public");
      }
    } catch (err: any) {
      alert(
        "Lỗi cập nhật ngày sinh: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  }

  async function handleUpdateWorkSchool() {
    if (readOnly) return;
    try {
      const response = await apiChangeSchool({
        school: workSchoolInput,
        privateSchool: privateWorkSchool,
        graduated: graduatedSchool,
      });
      if (response.success && response.profile) {
        setWorkSchool(response.profile.school || "");
        setWorkSchoolInput(response.profile.school || "");
        setPrivateWorkSchool(response.profile.privateSchool || "public");
        setPWorkSchool(response.profile.privateSchool || "public");
        // Nếu muốn set lại graduated từ kết quả response thì có thể thêm ở đây (nếu backend trả field này ra)
        // setGraduatedSchool(Boolean(response.profile.graduated));
      }
    } catch (err: any) {
      alert(
        "Lỗi cập nhật trường học/công việc: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  }

  // Helper để quyết định khi nào hiển thị "Đã ẩn"
  function isPrivateFieldOnReadonly(fieldPrivacy: string) {
    return readOnly && fieldPrivacy === "private";
  }

  return (
    <div className="gap-3 flex flex-col">
      <h3 className="text-2xl font-bold -ml-4 text-white w-full">Tổng quan</h3>
      {/* Họ và tên */}
      {!readOnly && editName ? (
        <form
          className="w-full flex justify-between flex-row p-5 pl-2 border border-red-500"
          onSubmit={async (e) => {
            e.preventDefault();
            if (nameInput.trim() !== "") {
              try {
                await handleUpdateName(nameInput);
                setEditName(false);
              } catch (err) {
                // handle error if needed
              }
            }
          }}
        >
          <div>
            <span className="text-[14px] text-white">Họ và tên</span>
            <div className="flex flex-1 flex-col">
              <input
                className="text-white focus:border focus:border-blue-500 w-[340px] text-[18px] bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 outline-none"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="h-10 pt-6">
            <div className="flex gap-2">
              <button
                type="submit"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7]"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8]"
                title="Hủy"
                onClick={() => {
                  setEditName(false);
                  setNameInput(name || "");
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="w-full h-10 flex justify-between items-center gap-2">
          <div className="flex items-center flex-1 min-w-0">
            <div className="text-white text-[18px] pr-2">Họ và tên :</div>
            <div className="text-white text-[18px] truncate">{name || "Chưa đặt"}</div>
          </div>
          {!readOnly && (
            <div
              className="w-[36px] h-[36px] flex-shrink-0 text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
              onClick={() => setEditName(true)}
              title="Chỉnh sửa"
            >
              <FontAwesomeIcon icon={faPencil} />
            </div>
          )}
        </div>
      )}

      {/* Sống tại */}
      {!readOnly && editLiving ? (
        <form
          className="w-full flex justify-between flex-row p-5 pl-2 border border-red-500"
          onSubmit={async (e) => {
            e.preventDefault();
            if (livingInput.trim() !== "") {
              try {
                await handleUpdateLiving();
                setEditLiving(false);
              } catch (err) {
                // handle error if needed
              }
            }
          }}
        >
          <div>
            <span className="text-[14px] text-white">Sống tại</span>
            <div className="flex flex-1 flex-col">
              <input
                className="text-white focus:border focus:border-blue-500 w-[340px] text-[18px] bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 outline-none"
                value={livingInput}
                onChange={(e) => setLivingInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-2">
              <label className="text-[14px] text-white mr-2">
                Ngày bắt đầu:
              </label>
              <input
                type="date"
                className="text-white focus:border focus:border-blue-500 w-[340px] text-[18px] bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 outline-none"
                value={dateLiving}
                onChange={(e) => setDateLiving(e.target.value)}
              />
            </div>
            <div className="mt-2">
              <label className="text-[14px] text-white mr-2">
                Quyền riêng tư:
              </label>
              <select
                className="bg-[#242526] border border-[#3B3D3E] text-white rounded px-2 py-1 outline-none cursor-pointer"
                value={privateLiving}
                onChange={(e) => setPrivateLiving(e.target.value)}
              >
                <option value="public">Công khai</option>
                <option value="friends">Bạn bè</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>
          </div>
          <div className="h-10 pt-6">
            <div className="flex gap-2">
              <button
                type="submit"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7]"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8]"
                title="Hủy"
                onClick={() => {
                  setEditLiving(false);
                  setLivingInput(living);
                  setDateLiving(whenLiving);
                  setPrivateLiving(pLiving);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="w-full h-10 flex justify-between items-center gap-2">
          <div className="flex items-center flex-1 min-w-0">
            {isPrivateFieldOnReadonly(pLiving) ? (
              <>
                <span className="text-white text-[18px] pr-2">Sống tại :</span>
                <span className="text-white text-[18px] italic text-gray-400">Đã ẩn</span>
              </>
            ) : living ? (
              <div className="text-white text-[18px] truncate">
                Bắt đầu sống ở {living}{" "}
                {whenLiving ? `từ ${whenLiving.split("T")[0]}` : ""}
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-white text-[18px] pr-2">Sống tại :</span>
                <span className="text-white text-[18px]">
                  {currentLiving || "Chưa đặt"}
                </span>
              </div>
            )}
            <div className="ml-2 flex-shrink-0">
              <span className="text-xs text-gray-400">
                {pLiving === "public" && "🌐"}
                {pLiving === "friends" && "👥"}
                {pLiving === "private" && "🔒"}
              </span>
            </div>
          </div>
          {!readOnly && (
            <div
              className="w-[36px] h-[36px] flex-shrink-0 text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
              onClick={() => setEditLiving(true)}
              title="Chỉnh sửa"
            >
              <FontAwesomeIcon icon={faPencil} />
            </div>
          )}
        </div>
      )}

      {/* Quê quán */}
      {!readOnly && editHometown ? (
        <form
          className="w-full flex justify-between flex-row p-5 pl-2 border border-red-500"
          onSubmit={async (e) => {
            e.preventDefault();
            if (hometownInput.trim() !== "") {
              try {
                await handleUpdateHometown();
                setEditHometown(false);
              } catch (err) {
                // handle error if needed
              }
            }
          }}
        >
          <div>
            <span className="text-[14px] text-white">Quê quán</span>
            <div className="flex flex-1 flex-col">
              <input
                className="text-white focus:border focus:border-blue-500 w-[340px] text-[18px] bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 outline-none"
                value={hometownInput}
                onChange={(e) => setHometownInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-2">
              <label className="text-[14px] text-white mr-2">
                Quyền riêng tư:
              </label>
              <select
                className="bg-[#242526] border border-[#3B3D3E] text-white rounded px-2 py-1 outline-none cursor-pointer"
                value={privateHometown}
                onChange={(e) => setPrivateHometown(e.target.value)}
              >
                <option value="public">Công khai</option>
                <option value="friends">Bạn bè</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>
          </div>
          <div className="h-10 pt-6">
            <div className="flex gap-2">
              <button
                type="submit"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7]"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8]"
                title="Hủy"
                onClick={() => {
                  setEditHometown(false);
                  setHometownInput(hometown);
                  setPrivateHometown(pHometown);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="w-full h-10 flex justify-between items-center gap-2">
          <div className="flex items-center flex-1 min-w-0">
            {isPrivateFieldOnReadonly(pHometown) ? (
              <>
                <div className="text-white text-[18px] pr-2">Quê quán :</div>
                <div className="text-white text-[18px] italic text-gray-400">Đã ẩn</div>
              </>
            ) : (
              <>
                <div className="text-white text-[18px] pr-2">Quê quán :</div>
                <div className="text-white text-[18px] truncate">{hometown || "Chưa đặt"}</div>
              </>
            )}
            <div className="ml-2 flex-shrink-0">
              <span className="text-xs text-gray-400">
                {pHometown === "public" && "🌐"}
                {pHometown === "friends" && "👥"}
                {pHometown === "private" && "🔒"}
              </span>
            </div>
          </div>
          {!readOnly && (
            <div
              className="w-[36px] h-[36px] flex-shrink-0 text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
              onClick={() => setEditHometown(true)}
              title="Chỉnh sửa"
            >
              <FontAwesomeIcon icon={faPencil} />
            </div>
          )}
        </div>
      )}

      {/* Năm sinh */}
      {!readOnly && editBirthDay ? (
        <form
          className="w-full flex justify-between flex-row p-5 pl-2 border border-red-500"
          onSubmit={async (e) => {
            e.preventDefault();
            if (birthDayInput.trim() !== "") {
              try {
                await handleUpdateBirthDay();
                setEditBirthDay(false);
              } catch (err) {
                // handle error if needed
              }
            }
          }}
        >
          <div>
            <span className="text-[14px] text-white">Năm sinh</span>
            <div className="flex flex-1 flex-col">
              <input
                type="date"
                className="text-white focus:border focus:border-blue-500 w-[340px] text-[18px] bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 outline-none"
                value={birthDayInput}
                onChange={(e) => setBirthDayInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-2">
              <label className="text-[14px] text-white mr-2">
                Quyền riêng tư:
              </label>
              <select
                className="bg-[#242526] border border-[#3B3D3E] text-white rounded px-2 py-1 outline-none cursor-pointer"
                value={privateBirthday}
                onChange={(e) => setPrivateBirthday(e.target.value)}
              >
                <option value="public">Công khai</option>
                <option value="friends">Bạn bè</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>
          </div>
          <div className="h-10 pt-6">
            <div className="flex gap-2">
              <button
                type="submit"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7]"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8]"
                title="Hủy"
                onClick={() => {
                  setEditBirthDay(false);
                  setBirthDayInput(birthDay);
                  setPrivateBirthday(pBirthDay);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="w-full h-10 flex justify-between items-center gap-2">
          <div className="flex items-center flex-1 min-w-0">
            {isPrivateFieldOnReadonly(pBirthDay) ? (
              <>
                <div className="text-white text-[18px] pr-2">Năm sinh :</div>
                <div className="text-white text-[18px] italic text-gray-400">Đã ẩn</div>
              </>
            ) : (
              <>
                <div className="text-white text-[18px] pr-2">Năm sinh :</div>
                <div className="text-white text-[18px] truncate">
                  {birthDay
                    ? (() => {
                        const date = new Date(birthDay);
                        const today = new Date();
                        let age = today.getFullYear() - date.getFullYear();
                        const m = today.getMonth() - date.getMonth();
                        if (
                          m < 0 ||
                          (m === 0 && today.getDate() < date.getDate())
                        ) {
                          age--;
                        }
                        return `${date.getDate()}/${
                          date.getMonth() + 1
                        }/${date.getFullYear()} - ${age} tuổi`;
                      })()
                    : "Chưa đặt"}
                </div>
              </>
            )}
            <div className="ml-2 flex-shrink-0">
              <span className="text-xs text-gray-400">
                {pBirthDay === "public" && "🌐"}
                {pBirthDay === "friends" && "👥"}
                {pBirthDay === "private" && "🔒"}
              </span>
            </div>
          </div>
          {!readOnly && (
            <div
              className="w-[36px] h-[36px] flex-shrink-0 text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
              onClick={() => setEditBirthDay(true)}
              title="Chỉnh sửa"
            >
              <FontAwesomeIcon icon={faPencil} />
            </div>
          )}
        </div>
      )}

      {/* Trường học / Công việc */}
      {!readOnly && editWorkSchool ? (
        <form
          className="w-full flex justify-between flex-row p-5 pl-2 border border-red-500"
          onSubmit={async (e) => {
            e.preventDefault();
            if (workSchoolInput.trim() !== "") {
              try {
                await handleUpdateWorkSchool();
                setEditWorkSchool(false);
              } catch (err) {
                // handle error if needed
              }
            }
          }}
        >
          <div>
            <span className="text-[14px] text-white">
              Trường học / Công việc
            </span>
            <div className="flex flex-1 flex-col">
              <input
                className="text-white focus:border focus:border-blue-500 w-[340px] text-[18px] bg-[#242526] border border-[#3B3D3E] rounded px-2 py-1 outline-none"
                value={workSchoolInput}
                onChange={(e) => setWorkSchoolInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center">
                <label className="text-[14px] text-white mr-2">
                  Quyền riêng tư:
                </label>
                <select
                  className="bg-[#242526] border border-[#3B3D3E] text-white rounded px-2 py-1 outline-none cursor-pointer"
                  value={privateWorkSchool}
                  onChange={(e) => setPrivateWorkSchool(e.target.value)}
                >
                  <option value="public">Công khai</option>
                  <option value="friends">Bạn bè</option>
                  <option value="private">Riêng tư</option>
                </select>
              </div>
              <div className="flex items-center ml-3">
                <input
                  type="checkbox"
                  id="graduatedSchool"
                  checked={graduatedSchool}
                  onChange={(e) => setGraduatedSchool(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="graduatedSchool" className="text-[14px] text-white select-none cursor-pointer">
                  Đã tốt nghiệp
                </label>
              </div>
            </div>
          </div>
          <div className="h-10 pt-6">
            <div className="flex gap-2">
              <button
                type="submit"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#58A2F7]"
                title="Lưu"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                type="button"
                className="cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#3B3D3E] hover:bg-[#4F5152] text-[#b0b3b8]"
                title="Hủy"
                onClick={() => {
                  setEditWorkSchool(false);
                  setWorkSchoolInput(workSchool);
                  setPrivateWorkSchool(pWorkSchool);
                  // Không reset graduatedSchool, vì đã là prop nên giữ nguyên
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="w-full h-10 flex justify-between items-center gap-2">
          <div className="flex items-center flex-1 min-w-0">
            {isPrivateFieldOnReadonly(pWorkSchool) ? (
              <>
                <div className="text-white text-[18px] pr-2">Trường học / Công việc :</div>
                <div className="italic text-gray-400 text-[18px]">Đã ẩn</div>
              </>
            ) : workSchool ? (
              <div className="text-white text-[18px] truncate">
                {graduatedSchool
                  ? <>Đã tốt nghiệp tại {workSchool}</>
                  : <>Đang học tại {workSchool}</>
                }
              </div>
            ) : (
              <div>
                <div className="text-white text-[18px] pr-2">
                  Trường học / Công việc :
                </div>
                <div className="text-white text-[18px]">Chưa đặt</div>
              </div>
            )}
            <div className="ml-2 flex-shrink-0">
              <span className="text-xs text-gray-400">
                {pWorkSchool === "public" && "🌐"}
                {pWorkSchool === "friends" && "👥"}
                {pWorkSchool === "private" && "🔒"}
              </span>
            </div>
          </div>
          {!readOnly && (
            <div
              className="w-[36px] h-[36px] flex-shrink-0 text-white flex items-center justify-center cursor-pointer rounded-full bg-[#3B3D3E] hover:bg-[#4F5152]"
              onClick={() => setEditWorkSchool(true)}
              title="Chỉnh sửa"
            >
              <FontAwesomeIcon icon={faPencil} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
