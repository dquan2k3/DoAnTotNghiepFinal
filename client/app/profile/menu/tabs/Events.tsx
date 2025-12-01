"use client";
import React, { useState, useEffect } from "react";
import {
  apiAddEvent,
  apiDeleteEvent,
  apiGetEvent,
  apiUpdateEvent,
} from "@/api/profile.api";

interface Event {
  id: string;
  event: string;
  date: string;
}

interface EventsProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  userId?: string; // optional userId, if present disables edit/add
}

export default function Events({ events, setEvents, userId }: EventsProps) {
  const [newEvent, setNewEvent] = useState("");
  // Lấy ngày hôm nay theo định dạng yyyy-mm-dd
  const today = new Date().toISOString().slice(0, 10);
  const [newDate, setNewDate] = useState(today);

  // Trạng thái cho việc chỉnh sửa sự kiện
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState("");
  const [editDate, setEditDate] = useState(today);

  useEffect(() => {
    let isMounted = true;
    // If userId tồn tại, truyền thêm vào API, không thì thôi
    const fetchEvents = async () => {
      try {
        const data = userId ? await apiGetEvent(userId) : await apiGetEvent();
        if (!isMounted) return;
        if (data && data.success && Array.isArray(data.events)) {
          const mappedEvents = data.events.map((ev: any) => ({
            id: ev._id,
            event: ev.name,
            date: ev.datetime ? ev.datetime.slice(0, 10) : "",
          }));
          setEvents(mappedEvents);
        }
      } catch (e: any) {
        if (!isMounted) return;
        alert(
          e?.response?.data?.message ||
            e?.message ||
            "Lỗi không xác định khi lấy sự kiện"
        );
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, [setEvents, userId]);

  // Thêm sự kiện mới
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) return; // Không cho thêm nếu đang xem user khác
    if (newEvent.trim() && newDate) {
      try {
        // Gọi API để thêm sự kiện lên server
        const response = await apiAddEvent({
          event: newEvent.trim(),
          date: newDate,
        });
        if (response && response.success && response.event) {
          setEvents([
            ...events,
            {
              id: response.event._id || Date.now().toString(),
              event: response.event.name || newEvent.trim(),
              date: response.event.datetime
                ? response.event.datetime.slice(0, 10)
                : newDate,
            },
          ]);
        } else {
          setEvents([
            ...events,
            {
              id: Date.now().toString(),
              event: newEvent.trim(),
              date: newDate,
            },
          ]);
        }
        setNewEvent("");
        setNewDate(today);
      } catch (err: any) {
        alert(
          "Lỗi khi thêm sự kiện: " +
            (err?.response?.data?.message || err?.message || "Thất bại")
        );
      }
    }
  };

  // Xóa sự kiện
  const handleDeleteEvent = async (id: string) => {
    if (userId) return; // Không cho xóa nếu đang xem user khác
    try {
      await apiDeleteEvent({ id });
      setEvents(events.filter((ev) => ev.id !== id));
    } catch (err: any) {
      alert(
        "Lỗi khi xóa sự kiện: " +
          (err?.response?.data?.message || err?.message || "Thất bại")
      );
    }
  };

  // Cập nhật sự kiện
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) return; // Không cho sửa nếu đang xem user khác
    if (editEvent.trim() && editDate && editingId) {
      try {
        await apiUpdateEvent({
          id: editingId,
          event: editEvent.trim(),
          date: editDate,
        });
        setEvents(
          events.map((ev) =>
            ev.id === editingId
              ? { ...ev, event: editEvent.trim(), date: editDate }
              : ev
          )
        );
        setEditingId(null);
        setEditEvent("");
        setEditDate(today);
      } catch (err: any) {
        alert(
          "Lỗi khi cập nhật sự kiện: " +
            (err?.response?.data?.message || err?.message || "Thất bại")
        );
      }
    }
  };

  // Sắp xếp ngược lại theo ngày (mới nhất lên đầu)
  const sortedEvents = [...events].sort((a, b) => {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });

  return (
    <div className="text-white w-full px-0">
      <h3 className="text-2xl font-bold mb-6 -ml-6 text-white w-full">
        Sự kiện trong đời
      </h3>
      {/* Chỉ hiển thị form thêm khi không ở chế độ view user khác */}
      {!userId && (
        <form
          className="flex flex-col sm:flex-row gap-2 mb-6 bg-[#232526] p-4 rounded-lg shadow w-full"
          onSubmit={handleAddEvent}
        >
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded bg-[#2c2f31] text-white outline-none w-full"
            placeholder="Nhập sự kiện (ví dụ: Kết hôn, Sinh con...)"
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            required
          />
          <input
            type="date"
            className="px-3 py-2 rounded bg-[#2c2f31] text-white outline-none min-w-[150px]"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-[#58A2F7] hover:bg-[#3b82f6] text-white px-4 py-2 rounded font-semibold cursor-pointer"
          >
            Thêm
          </button>
        </form>
      )}
      <ul className="space-y-4 w-full">
        {sortedEvents.length === 0 ? (
          <li className="text-gray-400 italic">Chưa có sự kiện nào.</li>
        ) : (
          sortedEvents.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center justify-between bg-[#232526] rounded-lg px-4 py-3 shadow w-full"
            >
              {/* Nếu đang ở chế độ xem user khác thì không hiển thị form chỉnh sửa */}
              {editingId === ev.id && !userId ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={handleUpdateEvent}
                >
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 rounded bg-[#2c2f31] text-white outline-none"
                    value={editEvent}
                    onChange={(e) => setEditEvent(e.target.value)}
                    required
                  />
                  <input
                    type="date"
                    className="px-2 py-1 rounded bg-[#2c2f31] text-white outline-none min-w-[120px]"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-semibold cursor-pointer"
                    title="Lưu"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded font-semibold cursor-pointer"
                    onClick={() => setEditingId(null)}
                    title="Hủy"
                  >
                    Hủy
                  </button>
                </form>
              ) : (
                <>
                  <div>
                    <div className="font-semibold text-lg">{ev.event}</div>
                    <div className="text-gray-400 text-sm">
                      {new Date(ev.date).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  {/* Nếu userId (đang xem người khác) thì ẩn nút chỉnh sửa/xóa */}
                  {!userId ? (
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition cursor-pointer"
                        onClick={() => {
                          setEditingId(ev.id);
                          setEditEvent(ev.event);
                          setEditDate(ev.date);
                        }}
                        title="Chỉnh sửa sự kiện"
                      >
                        Sửa
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition cursor-pointer"
                        onClick={() => handleDeleteEvent(ev.id)}
                        title="Xóa sự kiện"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

