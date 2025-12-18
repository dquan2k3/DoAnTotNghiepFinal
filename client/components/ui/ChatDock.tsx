"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useChatSocket } from "@/socket/useChatSocket";
import { useSelector } from "react-redux";
import { apiGetIncomeUser, getConversationDetail, loadMessage } from "@/api/conversation.api";

const MAX_OPEN_TABS = 3;
const GROUP_ROOM_ID = "global-room";

const formatDateTime = (value: string | Date) => {
  const d = value instanceof Date ? value : new Date(value);
  const date = d.toLocaleDateString("vi-VN");
  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time, full: `${time} ${date}` };
};

interface ChatMessage {
  id?: string | number;
  senderId: string;
  senderName?: string;
  message: string;
  createdAt: string | Date;
  isOutgoing?: boolean;
  conversationId?: string | number;
  conversationTitle?: string;
  conversationAvatarUrl?: string;
}

interface ChatConversation {
  id: string | number;
  title: string;
  avatarUrl?: string;
  conversationId?: string | number; // <-- allow for conversationId on initialConversations
}

interface ChatDockProps {
  conversations: ChatConversation[];
  onSendMessage?: (
    conversationId: ChatConversation["id"],
    text: string,
    senderName?: string
  ) => void;
  defaultOpenIds?: Array<ChatConversation["id"]>;
}

// Thêm cache cho thông tin avatar/name của peer để không gọi API lặp
type PeerInfo = {
  name: string;
  avatar: string;
};

// handleOpenChat như sau, nhận vào peerId, options (có thể có conversationId, conversationTitle, avatarUrl)
type OpenChatOpts = {
  conversationId?: string | number;
  conversationTitle?: string;
  avatarUrl?: string;
};

const ChatDock: React.FC<ChatDockProps> & { openChat?: Function } = ({
  conversations: initialConversations,
  onSendMessage,
  defaultOpenIds,
}) => {
  const user = useSelector((state: any) => state.user);
  const userId: string = user?.userId || "";
  const name: string = user?.profile?.name || "";

  const roomId = GROUP_ROOM_ID;

  const {
    sendPrivateMessage,
    sendRoomMessage,
    joinRoom,
    leaveRoom,
    listenMessages,
  } = useChatSocket(userId, name);

  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Record<string | number, ChatMessage[]>>({});
  const [openIds, setOpenIds] = useState<Array<ChatConversation["id"]>>(() => {
    const ids =
      (defaultOpenIds && defaultOpenIds.slice(0, MAX_OPEN_TABS)) ||
      initialConversations.slice(0, MAX_OPEN_TABS).map((c) => c.id);
    return [GROUP_ROOM_ID, ...ids.filter((id) => id !== GROUP_ROOM_ID)];
  });
  const [minimizedIds, setMinimizedIds] = useState<Array<ChatConversation["id"]>>([]);
  const [drafts, setDrafts] = useState<Record<string | number, string>>({});
  const [dynamicConversations, setDynamicConversations] = useState<ChatConversation[]>([]);
  const [minimizedUnread, setMinimizedUnread] = useState<Record<string | number, number>>({});
  const [peerInfo, setPeerInfo] = useState<Record<string, PeerInfo>>({});

  const [tabConversationIds, setTabConversationIds] = useState<Record<string | number, string | number>>({});

  const tabOpenedRef = useRef<Record<string | number, boolean>>({});

  const chatPanelsRef = useRef<Record<string | number, HTMLDivElement | null>>({});

  const scrollTriggerTabRef = useRef<Set<string | number>>(new Set());
  const scrollPendingInitTabRef = useRef<Set<string | number>>(new Set());

  const initialPromiseRef = useRef<Record<string | number, Promise<void> | null>>({});

  // Sửa lại: onTabInitial nhận thêm conversationId nếu có
  const onTabInitial = async (tabId: string | number, opts?: { conversationId?: string | number }) => {
    // Nếu đã có promise trước đó đang chạy => return lại nó luôn!
    if (initialPromiseRef.current[tabId]) {
      return initialPromiseRef.current[tabId];
    }
    const initialConv = initialConversations.find(c => c.id === tabId);

    let promise: Promise<void>;
    if (initialConv && initialConv.conversationId) {
      // Nếu đã có conversationId từ initialConv, gọi hàm với conversationId và KHÔNG set lại conversationId nữa
      promise = (async () => {
        try {
          scrollPendingInitTabRef.current.add(tabId);
          const result = await getConversationDetail({ userId: tabId as string, conversationId: initialConv.conversationId as string });
          if (result && Array.isArray(result.messages) && result.messages.length > 0) {
            setPrivateMessages((prev) => ({
              ...prev,
              [tabId]: result.messages.map((msg: any) => ({
                id: msg.id,
                senderId: msg.senderId,
                message: typeof msg.message !== "undefined" ? msg.message : "",
                createdAt: msg.createdAt,
                attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
                readBy: Array.isArray(msg.readBy) ? msg.readBy : [],
                isOutgoing: msg.senderId === userId,
              })),
            }));
          }
        } catch (err) {
          // no-op
        } finally {
          scrollPendingInitTabRef.current.delete(tabId);
        }
      })();
    } else {
      // Nếu không có conversationId, gọi hàm mà không truyền conversationId, nếu lấy được thì setTabConversationIds
      promise = (async () => {
        try {
          scrollPendingInitTabRef.current.add(tabId);
          const result = await getConversationDetail({ userId: tabId as string });
          if (result && result.conversationId) {
            setTabConversationIds((prev) => ({
              ...prev,
              [tabId]: result.conversationId,
            }));
          }
          if (result && Array.isArray(result.messages) && result.messages.length > 0) {
            setPrivateMessages((prev) => ({
              ...prev,
              [tabId]: result.messages.map((msg: any) => ({
                id: msg.id,
                senderId: msg.senderId,
                message: typeof msg.message !== "undefined" ? msg.message : "",
                createdAt: msg.createdAt,
                attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
                readBy: Array.isArray(msg.readBy) ? msg.readBy : [],
                isOutgoing: msg.senderId === userId,
              })),
            }));
          }
        } catch (err) {
          // no-op
        } finally {
          scrollPendingInitTabRef.current.delete(tabId);
        }
      })();
    }
    initialPromiseRef.current[tabId] = promise;
    promise.finally(() => {
      delete initialPromiseRef.current[tabId];
    });
    return promise;
  };

  useEffect(() => {
    joinRoom(roomId);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const off = listenMessages({
      onRoomMessage: (msg: any) => {
        setRoomMessages((prev) => [
          ...prev,
          {
            ...msg,
            isOutgoing: msg.senderId === userId,
          },
        ]);
        if (minimizedIds.includes(GROUP_ROOM_ID)) {
          setMinimizedUnread((prev) => ({
            ...prev,
            [GROUP_ROOM_ID]: (prev[GROUP_ROOM_ID] || 0) + 1,
          }));
        }
      },
      onPrivateMessage: async (msg: any) => {
        let peerId = msg.senderId;
        if (!peerId) return

        if (msg && msg.conversationId) {
          if (peerId !== userId) {
            setTabConversationIds((prev) => ({
              ...prev,
              [peerId]: msg.conversationId,
            }));
          }
          else {
            setTabConversationIds((prev) => ({
              ...prev,
              [msg.receiverId]: msg.conversationId,
            }));

            return
          }
        }

        let fetchedName = peerInfo[peerId]?.name || msg.senderName || msg.conversationTitle || "Người dùng";
        let fetchedAvatar = peerInfo[peerId]?.avatar || msg.conversationAvatarUrl || "";

        const hasPeerInfo = !!peerInfo[peerId];
        if (!hasPeerInfo) {
          try {
            const incomeUser = await apiGetIncomeUser(peerId);
            if (incomeUser && incomeUser.name) {
              fetchedName = incomeUser.name;
            }
            if (incomeUser && incomeUser.avatar) {
              fetchedAvatar = incomeUser.avatar;
            }

            setPeerInfo((prev) => ({
              ...prev,
              [peerId]: {
                name: fetchedName,
                avatar: fetchedAvatar,
              },
            }));
          } catch (err) {
            // no-op
          }
        }

        if (minimizedIds.includes(peerId)) {
          setMinimizedUnread((prev) => ({
            ...prev,
            [peerId]: (prev[peerId] || 0) + 1,
          }));
          setPrivateMessages((prev) => {
            const updated = {
              ...prev,
              [peerId]: [
                ...(prev[peerId] || []),
                {
                  ...msg,
                  isOutgoing: msg.senderId === userId,
                },
              ],
            };
            return updated;
          });
          return;
        }

        if (openIds.includes(peerId)) {
          setPrivateMessages((prev) => {
            const updated = {
              ...prev,
              [peerId]: [
                ...(prev[peerId] || []),
                {
                  ...msg,
                  isOutgoing: msg.senderId === userId,
                },
              ],
            };
            return updated;
          });
          setMinimizedIds((prev) => prev.filter((x) => x !== peerId));
          setMinimizedUnread((prev) => {
            if (prev[peerId]) {
              const newState = { ...prev };
              delete newState[peerId];
              return newState;
            }
            return prev;
          });
          return;
        }

        setDynamicConversations((prevConvs) => {
          if (
            peerId === GROUP_ROOM_ID ||
            prevConvs.some((c) => c.id === peerId) ||
            initialConversations.some((c) => c.id === peerId)
          ) {
            return prevConvs;
          }
          return [
            ...prevConvs,
            {
              id: peerId,
              title: fetchedName,
              avatarUrl: fetchedAvatar,
            },
          ];
        });

        setPrivateMessages((prev) => {
          const updated = {
            ...prev,
            [peerId]: [
              ...(prev[peerId] || []),
              {
                ...msg,
                isOutgoing: msg.senderId === userId,
              },
            ],
          };
          return updated;
        });

        setOpenIds((prev) => {
          if (prev.includes(peerId)) return prev;
          let ids = prev.filter((x) => x !== peerId);
          let next = [...ids, peerId];
          if (peerId !== GROUP_ROOM_ID && next.includes(GROUP_ROOM_ID)) {
            next = [
              GROUP_ROOM_ID,
              ...next.filter((x) => x !== GROUP_ROOM_ID),
            ];
          }
          if (
            next.length >
            MAX_OPEN_TABS +
            (next.includes(GROUP_ROOM_ID) ? 1 : 0)
          ) {
            const keepCount =
              MAX_OPEN_TABS +
              (next.includes(GROUP_ROOM_ID) ? 1 : 0);
            next = next.slice(next.length - keepCount);
          }
          if (!tabOpenedRef.current[peerId]) {
            onTabInitial(peerId)?.then(() => {
              tabOpenedRef.current[peerId] = true;
              setTimeout(() => {
                const node = chatPanelsRef.current[peerId];
                if (node) {
                  node.scrollTop = node.scrollHeight;
                }
              }, 0);
            });
            return next;
          }
          return next;
        });
        setMinimizedIds((prev) => prev.filter((x) => x !== peerId));
        setMinimizedUnread((prev) => {
          if (prev[peerId]) {
            const newState = { ...prev };
            delete newState[peerId];
            return newState;
          }
          return prev;
        });
      },
    });
    return () => off?.();
    // eslint-disable-next-line
  }, [userId, name, initialConversations, openIds, minimizedIds, peerInfo]);

  useEffect(() => { }, [privateMessages]);

  const mergedConversations = useMemo(() => {
    const merged: ChatConversation[] = [
      ...initialConversations,
      ...dynamicConversations.map((dc) => {
        if (peerInfo[dc.id as string]) {
          return {
            ...dc,
            title: peerInfo[dc.id as string].name,
            avatarUrl: peerInfo[dc.id as string].avatar,
          };
        }
        return dc;
      }).filter(
        (dc) => !initialConversations.some((ic) => ic.id === dc.id)
      ),
    ];
    return merged;
  }, [initialConversations, dynamicConversations, peerInfo]);

  const openConversations = useMemo(() => {
    const result: Array<{
      id: string | number;
      title: string;
      avatarUrl?: string;
      messages: ChatMessage[];
      conversationId?: string | number;
    }> = [];
    if (openIds.includes(GROUP_ROOM_ID)) {
      result.push({
        id: GROUP_ROOM_ID,
        title: "Nhóm chung",
        avatarUrl: undefined,
        messages: roomMessages,
        conversationId: GROUP_ROOM_ID,
      });
    }
    const realConvs = openIds
      .filter((id) => id !== GROUP_ROOM_ID)
      .map((id) => {
        const c = mergedConversations.find((cv) => cv.id === id);
        if (!c) return undefined;
        const conversationId: string | number | undefined = tabConversationIds[id] ?? c.conversationId ?? undefined;
        // If conversationId not present in tabConversationIds, fallback to conversationId from initialConversations
        return {
          ...c,
          messages: privateMessages[id] || [],
          conversationId,
        };
      })
      .filter(Boolean) as Array<{
        id: string | number;
        title: string;
        avatarUrl?: string;
        messages: ChatMessage[];
        conversationId?: string | number;
      }>;
    result.push(...realConvs);
    return result;
  }, [openIds, mergedConversations, roomMessages, privateMessages, tabConversationIds]);

  const minimizedConversations = useMemo(
    () =>
      minimizedIds
        .map((id) => {
          if (id === GROUP_ROOM_ID) {
            return {
              id: GROUP_ROOM_ID,
              title: "Nhóm chung",
              avatarUrl: undefined,
              messages: roomMessages,
              conversationId: GROUP_ROOM_ID,
            };
          }
          const c = mergedConversations.find((cv) => cv.id === id);
          if (!c)
            return undefined;
          const conversationId: string | number | undefined = tabConversationIds[id] ?? c.conversationId ?? undefined;
          return {
            ...c,
            messages: privateMessages[id] || [],
            conversationId,
          };
        })
        .filter(Boolean) as Array<{
          id: string | number;
          title: string;
          avatarUrl?: string;
          messages: ChatMessage[];
          conversationId?: string | number;
        }>,
    [minimizedIds, mergedConversations, roomMessages, privateMessages, tabConversationIds]
  );

  // handleOpenConversation: Nhận thêm opts, nếu có opts (vd: conversationId) thì truyền vào onTabInitial
  const handleOpenConversation = async (
    id: ChatConversation["id"],
    opts?: OpenChatOpts
  ) => {
    if (!tabOpenedRef.current[id]) {
      await onTabInitial(id, opts);
      tabOpenedRef.current[id] = true;
      setTimeout(() => {
        const node = chatPanelsRef.current[id];
        if (node) {
          node.scrollTop = node.scrollHeight;
        }
      }, 0);
    }

    if (openIds.includes(id)) {
      setOpenIds((prev) => {
        const filtered = prev.filter((x) => x !== id);
        return [...filtered, id];
      });
      setMinimizedIds((prev) => prev.filter((x) => x !== id));
      setMinimizedUnread((prev) => {
        if (prev[id]) {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        }
        return prev;
      });
      setTimeout(() => {
        const node = chatPanelsRef.current[id];
        if (node) {
          node.scrollTop = node.scrollHeight;
        }
      }, 0);
      return;
    }
    setOpenIds((prev) => {
      const ids = prev.filter((x) => x !== id);
      let next = [...ids, id];
      if (id !== GROUP_ROOM_ID && next.includes(GROUP_ROOM_ID)) {
        next = [GROUP_ROOM_ID, ...next.filter((x) => x !== GROUP_ROOM_ID)];
      }
      if (
        next.length > MAX_OPEN_TABS + (next.includes(GROUP_ROOM_ID) ? 1 : 0)
      ) {
        const keepCount =
          MAX_OPEN_TABS + (next.includes(GROUP_ROOM_ID) ? 1 : 0);
        next = next.slice(next.length - keepCount);
      }
      return next;
    });
    setMinimizedIds((prev) => prev.filter((x) => x !== id));
    setMinimizedUnread((prev) => {
      if (prev[id]) {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      }
      return prev;
    });
    setTimeout(() => {
      const node = chatPanelsRef.current[id];
      if (node) {
        node.scrollTop = node.scrollHeight;
      }
    }, 0);
  };

  // Đăng ký static method mở chat từ bên ngoài
  ChatDock.openChat = (peerId: string | number, opts?: OpenChatOpts) => {
    handleOpenConversation(peerId, opts);
  };

  useEffect(() => {
    if (defaultOpenIds && defaultOpenIds.length > 0) {
      const id = defaultOpenIds[0];
      handleOpenConversation(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOpenIds]);

  const handleMinimize = (id: ChatConversation["id"]) => {
    setOpenIds((prev) => prev.filter((x) => x !== id));
    setMinimizedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleCloseAll = () => {
    setOpenIds([]);
    setMinimizedIds([]);
    setDrafts({});
    setPrivateMessages({});
    setRoomMessages([]);
    setDynamicConversations([]);
    setMinimizedUnread({});
    setPeerInfo({});
    setTabConversationIds({});
    tabOpenedRef.current = {};
    chatPanelsRef.current = {};
    scrollTriggerTabRef.current = new Set();
    scrollPendingInitTabRef.current = new Set();
    initialPromiseRef.current = {};
  };

  const handleClose = (id: ChatConversation["id"]) => {
    setOpenIds((prev) => prev.filter((x) => x !== id));
    setMinimizedIds((prev) => prev.filter((x) => x !== id));
    setDrafts((prev) => {
      const cp = { ...prev };
      delete cp[id];
      return cp;
    });
    setPrivateMessages((prev) => {
      const cp = { ...prev };
      delete cp[id];
      return cp;
    });
    setMinimizedUnread((prev) => {
      const cp = { ...prev };
      delete cp[id];
      return cp;
    });
    setDynamicConversations((prev) => prev.filter((c) => c.id !== id));
    setPeerInfo((prev) => {
      const cp = { ...prev };
      delete cp[id as string];
      return cp;
    });
    setTabConversationIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    delete tabOpenedRef.current[id];
    delete chatPanelsRef.current[id];
    scrollTriggerTabRef.current.delete(id);
    scrollPendingInitTabRef.current.delete(id);
    delete initialPromiseRef.current[id];
    if (id === GROUP_ROOM_ID) {
      setRoomMessages([]);
    }
  };

  const handleChangeDraft = (
    id: ChatConversation["id"],
    value: string
  ) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSend = async (id: ChatConversation["id"]) => {
    const text = (drafts[id] || "").trim();
    if (!text) return;

    const conversationIdOfTab = tabConversationIds[id];

    const message: ChatMessage =
      id === GROUP_ROOM_ID
        ? {
          senderId: userId,
          senderName: name,
          message: text,
          createdAt: new Date(),
          isOutgoing: true,
          conversationId: conversationIdOfTab ?? undefined,
        }
        : {
          senderId: userId,
          message: text,
          createdAt: new Date(),
          isOutgoing: true,
          conversationId: conversationIdOfTab ?? undefined,
        };

    if (id === GROUP_ROOM_ID) {
      setRoomMessages((prev) => [...prev, { ...message }]);
      try {
        sendRoomMessage(roomId, text);
        setDrafts((prev) => ({ ...prev, [id]: "" }));
      } catch (err) { }
      setTimeout(() => {
        const node = chatPanelsRef.current[id];
        if (node) {
          node.scrollTop = node.scrollHeight;
        }
      }, 0);
      return;
    }

    let needInitial = false;
    if (!tabOpenedRef.current[id]) {
      needInitial = true;
      await onTabInitial(id);
      tabOpenedRef.current[id] = true;
    }

    setPrivateMessages((prev) => {
      const updated = {
        ...prev,
        [id]: [...(prev[id] || []), { ...message }],
      };
      return updated;
    });

    setOpenIds((prev) => {
      if (prev.includes(id)) {
        const filtered = prev.filter((x) => x !== id);
        return [...filtered, id];
      }
      let ids = prev.filter((x) => x !== id);
      let next = [...ids, id];
      if (id !== GROUP_ROOM_ID && next.includes(GROUP_ROOM_ID)) {
        next = [GROUP_ROOM_ID, ...next.filter((x) => x !== GROUP_ROOM_ID)];
      }
      if (
        next.length > MAX_OPEN_TABS + (next.includes(GROUP_ROOM_ID) ? 1 : 0)
      ) {
        const keepCount =
          MAX_OPEN_TABS + (next.includes(GROUP_ROOM_ID) ? 1 : 0);
        next = next.slice(next.length - keepCount);
      }
      return next;
    });
    setMinimizedIds((prev) => prev.filter((x) => x !== id));
    setMinimizedUnread((prev) => {
      if (prev[id]) {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      }
      return prev;
    });

    try {
      if (conversationIdOfTab != null) {
        sendPrivateMessage(
          id,
          text,
          conversationIdOfTab
        );
      } else {
        sendPrivateMessage(
          id,
          text
        );
      }
      setDrafts((prev) => ({ ...prev, [id]: "" }));
      setTimeout(() => {
        const node = chatPanelsRef.current[id];
        if (node) {
          node.scrollTop = node.scrollHeight;
        }
      }, 0);
    } catch (err) {
      try {
        onSendMessage?.(id, text, name);
        setDrafts((prev) => ({ ...prev, [id]: "" }));
        setTimeout(() => {
          const node = chatPanelsRef.current[id];
          if (node) {
            node.scrollTop = node.scrollHeight;
          }
        }, 0);
      } catch (_err) { }
    }
  };

  useEffect(() => {
    openConversations.forEach((conv) => {
      if (scrollTriggerTabRef.current.has(conv.id)) {
        if (scrollPendingInitTabRef.current.has(conv.id)) {
          return;
        }
        const node = chatPanelsRef.current[conv.id];
        if (node) {
          node.scrollTop = node.scrollHeight;
        }
        scrollTriggerTabRef.current.delete(conv.id);
      }
    });
  }, [openConversations]);

  const loadingScrollRef = useRef<Record<string | number, boolean>>({});
  const finishedScrollRef = useRef<Record<string | number, boolean>>({});

  const handleChatPanelScroll = useCallback(
    (
      convId: string | number,
      convMessages?: ChatMessage[],
      convConversationId?: string | number
    ) => async (e: React.UIEvent<HTMLDivElement>) => {
      const node = e.currentTarget;

      if (finishedScrollRef.current[convId]) return;
      if (loadingScrollRef.current[convId]) return;

      if (node.scrollTop <= 1) {
        let oldMsg =
          convMessages && Array.isArray(convMessages) && convMessages.length > 0
            ? convMessages[0]
            : undefined;
        let conversationIdToShow =
          typeof convConversationId !== "undefined"
            ? convConversationId
            : oldMsg?.conversationId ??
            (convMessages && convMessages.length > 0 ? convMessages[0].conversationId : undefined);
        let cursorAt =
          oldMsg && oldMsg.createdAt
            ? (oldMsg.createdAt instanceof Date
              ? oldMsg.createdAt.toISOString()
              : new Date(oldMsg.createdAt).toISOString())
            : undefined;

        if (finishedScrollRef.current[convId]) return;

        if (conversationIdToShow) {
          try {
            loadingScrollRef.current[convId] = true;
            const response = await loadMessage(
              conversationIdToShow as string,
              cursorAt
            );

            if (
              !response ||
              response.messages === null ||
              (Array.isArray(response.messages) && response.messages.length === 0)
            ) {
              finishedScrollRef.current[convId] = true;
              loadingScrollRef.current[convId] = false;
              return;
            }

            if (Array.isArray(response.messages) && response.messages.length > 0) {
              setPrivateMessages((prev) => {
                const existing = prev[convId] || [];
                const newMsgs: ChatMessage[] = response.messages.map((msg: any) => ({
                  id: msg.id,
                  senderId: msg.senderId,
                  message: typeof msg.message !== "undefined" ? msg.message : "",
                  createdAt: msg.createdAt,
                  attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
                  readBy: Array.isArray(msg.readBy) ? msg.readBy : [],
                  isOutgoing: msg.senderId === userId,
                  conversationId: msg.conversationId
                }));

                const existingIds = new Set(existing.map(m => m.id));
                const trulyNew = newMsgs.filter(m => m.id && !existingIds.has(m.id));

                return {
                  ...prev,
                  [convId]: [...trulyNew, ...existing]
                };
              });

              setTimeout(() => {
                if (node) {
                  node.scrollTop = 1;
                }
              }, 0);
            }
          } catch (error) {
            console.error(
              "[ChatDock][handleChatPanelScroll] loadMessage error: ",
              error
            );
          } finally {
            loadingScrollRef.current[convId] = false;
          }
        } else {
          console.log(
            "[ChatDock][handleChatPanelScroll] No valid conversationId to fetch more messages."
          );
        }
      }
    },
    [userId]
  );

  if (openConversations.length === 0 && minimizedConversations.length === 0)
    return null;

  return (
    <div
      className="fixed right-0 z-[9980] flex items-end gap-3 select-none"
      style={{
        bottom: 0,
        marginBottom: 0,
      }}
    >
      {/* Minimized tab icons */}
      <div className="flex flex-col-reverse items-center gap-2 !mb-2">
        {minimizedConversations.map((c) => (
          <div
            key={c.id}
            className="relative"
            style={{ width: 48, height: 48, marginBottom: 12, marginRight: 0 }}
          >
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-semibold shadow-lg transition"
              style={{
                marginRight: 0,
                paddingRight: 0,
                cursor: "pointer",
                position: "absolute",
                top: 0,
                left: 0,
                width: 48,
                height: 48,
                zIndex: 1,
                marginBottom: 8,
              }}
              onClick={() => handleOpenConversation(c.id)}
              title={c.title}
              tabIndex={0}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.filter =
                  "brightness(1.14)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.filter = "";
              }}
            >
              {minimizedUnread[c.id] && minimizedUnread[c.id] > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "#e11d48",
                    color: "#fff",
                    minWidth: 18,
                    height: 18,
                    lineHeight: "18px",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    boxSizing: "border-box",
                    boxShadow: "0 0 0 2px #444",
                  }}
                >
                  {minimizedUnread[c.id]}
                </span>
              )}
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.title}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg">
                  {c.title?.[0]?.toUpperCase() || "C"}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(c.id);
              }}
              className="absolute bg-[#23272f] hover:bg-[#e11d48] hover:text-white text-gray-400 transition-all border-none rounded-full flex items-center justify-center"
              style={{
                top: -6,
                right: -6,
                width: 20,
                height: 20,
                zIndex: 2,
                fontSize: 12,
                boxShadow: "0 1px 6px rgba(0,0,0,.17)",
                cursor: "pointer",
                border: "1px solid #444",
              }}
              title="Đóng"
              tabIndex={0}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Tabs đang mở */}
      <div className="flex flex-row-reverse gap-3">
        {openConversations.map((conv) => (
          <div
            key={conv.id}
            className="bg-[#17181a] text-white shadow-2xl border border-[#2f3133] flex flex-col overflow-hidden"
            style={{
              borderRadius: 0,
              width: 330,
              minWidth: 330,
              maxWidth: 330,
              height: 575,
              minHeight: 575,
              maxHeight: 575,
              marginBottom: 0,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#1f2125] border-b border-[#2e3033]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold">
                  {conv.avatarUrl ? (
                    <img
                      src={conv.avatarUrl}
                      alt={conv.title}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{conv.title?.[0]?.toUpperCase() || "C"}</span>
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold truncate">
                    {conv.title}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Đang hoạt động
                  </span>
                  {conv.id !== GROUP_ROOM_ID && (
                    <span className="text-[10px] text-gray-500" style={{ wordBreak: 'break-all' }}>
                      conversationId: {conv.conversationId ? String(conv.conversationId) : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full border-none"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "transparent",
                    transition: "background-color 0.2s",
                    fontSize: 24,
                    color: "#2563eb",
                    cursor: "pointer",
                  }}
                  onClick={() => handleMinimize(conv.id)}
                  title="Thu gọn"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#35383d")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  −
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full border-none"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "transparent",
                    transition: "background-color 0.2s",
                    fontSize: 28,
                    color: "#2563eb",
                    cursor: "pointer",
                  }}
                  onClick={() => handleClose(conv.id)}
                  title="Đóng"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#35383d")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  ×
                </button>
              </div>
            </div>

            {/* Danh sách tin nhắn */}
            <div
              className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar"
              style={{ maxHeight: 575 - 98 }}
              ref={el => {
                chatPanelsRef.current[conv.id] = el;
              }}
              onScroll={handleChatPanelScroll(conv.id, conv.messages, conv.conversationId)}
            >
              {conv.messages.map((m, idx) => {
                const { date, time, full } = formatDateTime(m.createdAt);
                const isOutgoing =
                  m.isOutgoing !== undefined
                    ? m.isOutgoing
                    : m.senderId === userId;

                return (
                  <div
                    key={m.id ?? idx}
                    className={`flex w-full ${isOutgoing ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[85%] flex flex-col ${isOutgoing ? "items-end" : "items-start"
                        }`}
                    >
                      {(m.senderName ?? "").trim() !== "" && (
                        <span
                          className="mb-0.5"
                          style={{
                            fontSize: 12,
                            color: "#a0a0a0",
                            fontWeight: 600,
                          }}
                          title={full}
                        >
                          {m.senderName}
                        </span>
                      )}
                      <div
                        className="px-3 py-2 text-sm rounded-full break-words"
                        style={{
                          background: isOutgoing ? "#2458F8" : "#303030",
                          color: "#fff",
                        }}
                        title={full}
                      >
                        {m.message}
                      </div>
                    </div>
                  </div>
                );
              })}
              {conv.messages.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-4">
                  Hãy bắt đầu cuộc trò chuyện...
                </div>
              )}
            </div>

            {/* Ô nhập tin nhắn */}
            <div className="border-t border-[#2e3033] px-3 py-2 bg-[#1b1d20]">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 bg-[#121316] text-sm text-white px-3 py-2 rounded-full outline-none border border-transparent focus:border-blue-500"
                  placeholder="Nhập tin nhắn..."
                  value={drafts[conv.id] || ""}
                  onChange={(e) =>
                    handleChangeDraft(conv.id, e.target.value)
                  }
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      await handleSend(conv.id);
                    }
                  }}
                  disabled={false}
                />
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-full bg-[#2563eb] text-white font-semibold hover:brightness-110 disabled:opacity-50"
                  onClick={async () => await handleSend(conv.id)}
                  disabled={!((drafts[conv.id] || "").trim().length)}
                >
                  Gửi
                </button>
              </div>
              {conv.id === GROUP_ROOM_ID && (
                <div className="text-xs text-gray-400 pt-1">
                  Đây là nhóm chat chung (global) sử dụng room-socket, tất cả user đều vào phòng này khi kết nối!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatDock;
