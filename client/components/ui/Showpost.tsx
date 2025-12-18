"use client";
import React from "react";
import PostReactButton from "./PostReactButton";
import { getCloudinaryImageLink } from "@/helper/croppedImageHelper";
import { apiCommentPost } from "@/api/post.api";

// Helper để hiển thị mốc thời gian: x phút/giờ/ngày/tháng/năm trước
function getTimeAgo(date: string | number | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} ngày trước`;
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} tháng trước`;
    const diffYear = Math.floor(diffMonth / 12);
    return `${diffYear} năm trước`;
}

// Dummy mock comments - đổi createdAt về ISO string cho dễ xử lý
const mockCommentsInitial = [
    {
        id: 1,
        user: { avatar: "", name: "Nguyễn Văn A", username: "nguyenvana" },
        content: "Bài viết hay quá!",
        createdAt: new Date().toISOString(),
    },
    {
        id: 2,
        user: { avatar: "", name: "Trần Thị B", username: "tranthib" },
        content: "Tôi đồng ý với bạn.",
        createdAt: new Date().toISOString(),
    },
    {
        id: 3,
        user: { avatar: "", name: "Lê Văn C", username: "levanc" },
        content: "Hay đấy!",
        createdAt: new Date().toISOString(),
    },
    {
        id: 4,
        user: { avatar: "", name: "Phạm Thị D", username: "phamthid" },
        content: "Thật tuyệt vời.",
        createdAt: new Date().toISOString(),
    },
    {
        id: 5,
        user: { avatar: "", name: "Đoàn Văn E", username: "doanvane" },
        content: "Like bài này.",
        createdAt: new Date().toISOString(),
    },
    {
        id: 6,
        user: { avatar: "", name: "Bùi Thị F", username: "buithif" },
        content: "Thông tin hữu ích!",
        createdAt: new Date().toISOString(),
    },
    {
        id: 7,
        user: { avatar: "", name: "Ngô Văn G", username: "ngovang" },
        content: "Cảm ơn bạn đã chia sẻ.",
        createdAt: new Date().toISOString(),
    },
    {
        id: 8,
        user: { avatar: "", name: "Trịnh Thị H", username: "trinhthih" },
        content: "Bài viết rất ý nghĩa.",
        createdAt: new Date().toISOString(),
    },
    {
        id: 9,
        user: { avatar: "", name: "Phan Văn I", username: "phanvani" },
        content: "Đồng tình với quan điểm này.",
        createdAt: new Date().toISOString(),
    },
    {
        id: 10,
        user: { avatar: "", name: "Vũ Thị K", username: "vuthik" },
        content: "Bài đăng chất lượng!",
        createdAt: new Date().toISOString(),
    },
];

function Avatar({
    src,
    size,
    className,
    croppedArea,
}: {
    src?: string;
    size?: number;
    className?: string;
    croppedArea?: any;
}) {
    return (
        <img
            src={src || "https://ui-avatars.com/api/?name=Demo&background=random"}
            alt="avatar"
            width={size || 40}
            height={size || 40}
            className={className || "rounded-full"}
            style={{ objectFit: "cover", width: size || 40, height: size || 40 }}
        />
    );
}

function getCloudinaryCoverLink(
    url?: string,
    croppedArea?: any,
    width: number = 390,
    height: number = 144
) {
    return url || "https://res.cloudinary.com/dpztbd1zk/image/upload/v1758185478/noneCover_m2j00b.png";
}

type PostType = {
    _id: string;
    text: string;
    files?: any[];
    liked?: boolean;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    avatar?: string;
    name?: string;
    username?: string;
    avatarCroppedArea?: any;
    createdAt?: string;
    bioUser?: {
        avatar?: string;
        avatarCroppedArea?: any;
        cover?: string;
        coverCroppedArea?: any;
    };
    profileUser?: {
        name?: string;
        username?: string;
    };
    user: string;
    relationship?: any;
    privacy?: string;
    hasShared?: boolean;
    myReact?: "like" | "love" | "fun" | "sad" | "angry" | null;
    reactCounts?: { [key in "like" | "love" | "fun" | "sad" | "angry"]?: number };
    updatedAt?: string;
};

// --------------- FIXED: Define a union type for comments ------------------

type PendingComment = {
    id: string;
    user: { avatar?: string; name: string; username: string };
    content: string;
    createdAt: string;
    pending: true;
};

type RealComment = {
    id: number | string;
    user: { avatar?: string; name: string; username: string };
    content: string;
    createdAt: string;
    // No "pending"
};

type AnyComment = PendingComment | RealComment;

// Props: truyền thêm avatar bản thân và onComment gửi lên
interface ShowpostProps {
    isShow: boolean;
    post: PostType;
    onClose: () => void;
    // Thay đổi props để nhận onReact từ cha 
    onReact: (
        reactionName: "like" | "love" | "fun" | "sad" | "angry" | null,
        prevReaction: "like" | "love" | "fun" | "sad" | "angry" | null,
        postId: string
    ) => void;
    myAvatar?: string;
    onSendComment?: (text: string) => void;
    onShare?: (postId: string) => void;
}

const Showpost: React.FC<ShowpostProps> = ({
    isShow,
    post,
    onClose,
    onReact,
    onShare,
    myAvatar,
    onSendComment
}) => {
    if (!isShow || !post) return null;

    function getPostAvatar(post: PostType, size: number = 40): string {
        if (post.bioUser && post.bioUser.avatar) {
            return getCloudinaryImageLink(post.bioUser.avatar, post.bioUser.avatarCroppedArea, size);
        }
        return "https://ui-avatars.com/api/?name=Demo&background=random";
    }
    function getPostName(post: PostType): string {
        if (post.profileUser && post.profileUser.name) {
            return post.profileUser.name;
        }
        return "Bạn";
    }
    function getPostUsername(post: PostType): string {
        if (post.profileUser && post.profileUser.username) {
            return post.profileUser.username;
        }
        return "";
    }

    const renderMedia = (
        file: any,
        idx: number,
        extra: { className?: string; style?: React.CSSProperties } = {}
    ) => {
        if (file.file_type === "video") {
            return (
                <video
                    key={idx}
                    controls
                    className={`w-full h-full object-cover ${extra.className || ""}`.replace(/rounded-2xl/g, "")}
                    style={extra.style && 'borderRadius' in extra.style ? { ...extra.style, borderRadius: undefined } : extra.style}
                >
                    <source src={file.file_url} />
                </video>
            );
        }
        return (
            <img
                key={idx}
                src={file.file_url}
                alt="post_file"
                className={`w-full h-full object-cover ${extra.className || ""}`.replace(/rounded-2xl/g, "")}
                style={extra.style && 'borderRadius' in extra.style ? { ...extra.style, borderRadius: undefined } : extra.style}
            />
        );
    };

    const files = Array.isArray(post.files) ? post.files : [];
    const fileCount = files.length;
    let mediaBlock = null;

    if (fileCount === 1) {
        mediaBlock = (
            <div className="w-full" style={{ marginTop: 8 }}>
                {renderMedia(files[0], 0, {
                    className: "",
                    style: {
                        height: "auto",
                        maxHeight: "800px",
                        minHeight: "200px",
                        objectFit: "contain",
                        width: "100%",
                        padding: 0,
                        margin: 0,
                        display: "block",
                    },
                })}
            </div>
        );
    } else if (fileCount === 2) {
        mediaBlock = (
            <div className="w-full flex" style={{ marginTop: 8, gap: 8 }}>
                {files.map((f, idx2) =>
                    <div key={idx2} className="flex-1" style={{
                        padding: 0,
                        margin: 0,
                        ...(idx2 === 0 ? { marginRight: 4 } : { marginLeft: 4 }),
                    }}>
                        {renderMedia(f, idx2, {
                            className: "",
                            style: {
                                height: "256px",
                                width: "100%",
                                padding: 0,
                                margin: 0,
                                display: "block",
                            },
                        })}
                    </div>
                )}
            </div>
        );
    } else if (fileCount === 3) {
        mediaBlock = (
            <div
                className="w-full flex flex-col"
                style={{ marginTop: 8, height: "400px", gap: 8 }}
            >
                <div className="flex-1 flex" style={{ gap: 8 }}>
                    {renderMedia(files[0], 0, {
                        className: "",
                        style: {
                            height: "196px",
                            width: "100%",
                            padding: 0,
                            margin: 0,
                            objectFit: "cover",
                            display: "block"
                        },
                    })}
                </div>
                <div className="flex flex-row flex-1" style={{ gap: 8 }}>
                    {files.slice(1, 3).map((f, idx2) =>
                        <div key={idx2} className="flex-1" style={{
                            padding: 0,
                            margin: 0,
                            ...(idx2 === 0 ? { marginRight: 4 } : { marginLeft: 4 }),
                        }}>
                            {renderMedia(f, idx2 + 1, {
                                className: "",
                                style: {
                                    height: "196px",
                                    width: "100%",
                                    padding: 0,
                                    margin: 0,
                                    objectFit: "cover",
                                    display: "block"
                                },
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    } else if (fileCount === 4) {
        mediaBlock = (
            <div
                className="w-full flex flex-col"
                style={{ marginTop: 8, height: "400px", gap: 8 }}
            >
                <div className="flex-1 flex" style={{ gap: 8 }}>
                    {[0, 1].map((i) => (
                        <div key={i} className="flex-1" style={{
                            padding: 0,
                            margin: 0,
                            ...(i === 0 ? { marginRight: 4 } : { marginLeft: 4 }),
                        }}>
                            {renderMedia(files[i], i, {
                                className: "",
                                style: {
                                    height: "196px",
                                    width: "100%",
                                    padding: 0,
                                    margin: 0,
                                    objectFit: "cover",
                                    display: "block"
                                },
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex-1 flex" style={{ gap: 8 }}>
                    {[2, 3].map((i) => (
                        <div key={i} className="flex-1" style={{
                            padding: 0,
                            margin: 0,
                            ...(i === 2 ? { marginRight: 4 } : { marginLeft: 4 }),
                        }}>
                            {renderMedia(files[i], i, {
                                className: "",
                                style: {
                                    height: "196px",
                                    width: "100%",
                                    padding: 0,
                                    margin: 0,
                                    objectFit: "cover",
                                    display: "block"
                                },
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    } else if (fileCount >= 5) {
        const moreCount = fileCount - 5;
        mediaBlock = (
            <div className="w-full flex flex-col" style={{ marginTop: 8, height: "400px", gap: 8 }}>
                <div className="flex w-full" style={{ height: "196px", gap: 8 }}>
                    {files.slice(0, 2).map((f, idx2) => (
                        <div key={idx2} className="flex-1" style={{
                            padding: 0,
                            margin: 0,
                            ...(idx2 === 0 ? { marginRight: 4 } : { marginLeft: 4 }),
                        }}>
                            {renderMedia(f, idx2, {
                                className: "",
                                style: {
                                    height: "100%",
                                    width: "100%",
                                    padding: 0,
                                    margin: 0,
                                    display: "block"
                                },
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex w-full" style={{ height: "196px", gap: 8 }}>
                    {files.slice(2, 5).map((f, idx2) => {
                        if (idx2 === 2 && moreCount > 0) {
                            return (
                                <div key={idx2} className="relative flex-1 h-full" style={{
                                    padding: 0,
                                    margin: 0,
                                    marginLeft: 4,
                                }}>
                                    {renderMedia(f, idx2 + 2, {
                                        className: "",
                                        style: {
                                            height: "100%",
                                            width: "100%",
                                            padding: 0,
                                            margin: 0,
                                            display: "block"
                                        },
                                    })}
                                    <div
                                        className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer"
                                    >
                                        <span className="text-white text-2xl font-bold">
                                            +{moreCount}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div key={idx2} className="flex-1 h-full" style={{
                                padding: 0,
                                margin: 0,
                                ...(idx2 === 0 ? { marginRight: 4 } : { marginLeft: 4 }),
                            }}>
                                {renderMedia(f, idx2 + 2, {
                                    className: "",
                                    style: {
                                        height: "100%",
                                        width: "100%",
                                        padding: 0,
                                        margin: 0,
                                        display: "block"
                                    },
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const postName = getPostName(post);
    const postAvatar = getPostAvatar(post, 40);
    const postUsername = getPostUsername(post);

    React.useEffect(() => {
        if (!isShow) return;
        const originalOverflow = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isShow]);

    // -- START comment logic replacement --

    // Hiển thị comment động (mock + commentNewList)
    // Lưu ý: giữ mockCommentsInitial bất biến, chỉ dùng cho khởi tạo/so sánh!
    const [comments, setComments] = React.useState<RealComment[]>(() => mockCommentsInitial);
    const [visibleComments, setVisibleComments] = React.useState(5);
    const [isCommentInputFocused, setIsCommentInputFocused] = React.useState(false);

    // Danh sách các comment "chờ gửi"/pending do user gửi lên, sẽ append vào đầu comments
    const [pendingComments, setPendingComments] = React.useState<PendingComment[]>([]);

    // Reset khi mở modal mới
    React.useEffect(() => {
        if (isShow) {
            setVisibleComments(5);
            setComments(mockCommentsInitial);
            setPendingComments([]);
        }
    }, [isShow]);

    const hasMoreComments = visibleComments < (pendingComments.length + comments.length);

    const [commentInput, setCommentInput] = React.useState("");
    const commentInputRef = React.useRef<HTMLTextAreaElement>(null);

    // Sử dụng 500px maxHeight cho textarea, và autofit lên tới mức này
    const MAX_TEXTAREA_HEIGHT = 500;

    const adjustTextareaHeight = () => {
        const textarea = commentInputRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            // Dùng MAX_TEXTAREA_HEIGHT thay vì hardcode 200 để cho phép lên tới 500px
            let newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
            textarea.style.height = `${newHeight}px`;
        }
    };

    React.useEffect(() => {
        adjustTextareaHeight();
    }, [commentInput]);

    // Helper để lấy nhanh tên và username cho user (tạm lấy là "Bạn" và username là "me" nếu không props)
    function getCurrentUserCommentMeta() {
        return {
            name: post.profileUser?.name || "Bạn",
            username: post.profileUser?.username || "me",
            avatar: myAvatar || "",
        };
    }

    // SEND comment logic: append tạm vào đầu pending, API xong thì remove pending và add comment (nếu thành công)
    const handleSendComment = async () => {
        const text = commentInput.trim();
        if (text.length === 0) return;

        // Fake ID cho pending comment (để key react và xác định unique), vd "pending-xxxx"
        const pendingId = "pending-" + Math.random().toString(36).slice(2, 10);

        // Tạo comment fake
        const userMeta = getCurrentUserCommentMeta();
        const pendingCommentObj: PendingComment = {
            id: pendingId,
            user: {
                avatar: userMeta.avatar,
                name: userMeta.name,
                username: userMeta.username,
            },
            content: text,
            createdAt: new Date().toISOString(),
            pending: true,
        };

        // Append tạm vào pendingComments (ở đầu)
        setPendingComments(prev => [pendingCommentObj, ...prev]);
        setCommentInput("");
        if (commentInputRef.current) {
            commentInputRef.current.focus();
            adjustTextareaHeight();
        }
        if (onSendComment) onSendComment(text);

        // Gửi request
        try {
            const res = await apiCommentPost({ postId: post._id, comment: text });
            // Hủy hiệu ứng pending (xoá khỏi pendingComments)
            setPendingComments(prev => prev.filter(c => c.id !== pendingId));
            // Nếu thành công (giả sử response: {success: true, data: <comment info>}), append real comment vào đầu
            if (res && res.success) {
                const commentResp = res.data;
                setComments(prev => [
                    {
                        id: commentResp?._id || Date.now().toString(),
                        user: {
                            avatar: commentResp?.user?.avatar || userMeta.avatar,
                            name: commentResp?.user?.name || userMeta.name,
                            username: commentResp?.user?.username || userMeta.username,
                        },
                        content: commentResp?.content || text,
                        createdAt: commentResp?.createdAt
                            ? new Date(commentResp.createdAt).toISOString()
                            : new Date().toISOString(),
                    },
                    ...prev,
                ]);
            }
            // Nếu không có res.success thì sẽ xử lý ở else
            else {
                // Xoá luôn pending (đã vừa xoá ở trên); có thể show notification/toast fail nếu muốn
            }
        } catch (err) {
            // Nếu thất bại network/API, hủy hiệu ứng + xoá luôn pending comment
            setPendingComments(prev => prev.filter(c => c.id !== pendingId));
            // Có thể show toast lỗi ở đây nếu muốn
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendComment();
        }
    };

    const HEADER_HEIGHT = 54;
    const FOOTER_HEIGHT = 72 + 10;

    const modalRef = React.useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (
            commentInputRef.current &&
            document.activeElement === commentInputRef.current
        ) {
            return;
        }
        if (
            modalRef.current &&
            !modalRef.current.contains(e.target as Node)
        ) {
            onClose();
        }
    };

    React.useEffect(() => {
        if (!isShow) return;
        const handleKeyDownEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDownEscape);
        return () => window.removeEventListener("keydown", handleKeyDownEscape);
    }, [isShow, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                padding: "10px",
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(1px)",
                overflow: "hidden",
            }}
            onClick={handleOverlayClick}
        >
            <div
                ref={modalRef}
                className="relative mx-auto bg-[#1e1e1f] rounded-3xl shadow-xl border border-[#363636] flex flex-col"
                style={{
                    maxHeight: "calc(100vh - 40px)",
                    height: "auto",
                    width: "680px",
                    maxWidth: "100vw",
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Tiêu đề trên cùng */}
                <div
                    className="w-full flex items-center justify-center font-semibold text-white text-lg py-3 border-b border-[#343434] sticky top-0 left-0 z-30 bg-[#1e1e1f] rounded-t-3xl"
                    style={{
                        minHeight: HEADER_HEIGHT,
                        position: "sticky",
                        top: 0,
                    }}
                >
                    Bài viết của {postName}
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-600 focus:outline-none z-10 cursor-pointer"
                        onClick={onClose}
                        aria-label="Đóng"
                        tabIndex={0}
                        type="button"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            fill="none"
                            viewBox="0 0 20 20"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l8 8M6 14L14 6" />
                        </svg>
                    </button>
                </div>
                {/* Main Nội dung cuộn được */}
                <div
                    className="flex-1 flex flex-col custom-scroll"
                    style={{
                        maxHeight: `calc(100vh - 40px - ${HEADER_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
                        overflowY: "auto",
                        paddingTop: 0,
                        paddingBottom: 0,
                    }}
                >
                    {/* Info row */}
                    <div className="flex w-full pt-2 px-2">
                        <div className="flex items-center relative pr-2 z-20 max-w-full">
                            <div className="flex items-center">
                                <Avatar
                                    src={postAvatar}
                                    size={40}
                                    className="rounded-full flex-shrink-0 mr-3"
                                />
                            </div>
                            <div className="flex flex-col justify-center leading-none">
                                <span className="font-semibold mb-1">{postName}</span>
                                <span className="text-sm text-[#b0b3b8]">
                                    {post.createdAt
                                        ? getTimeAgo(post.createdAt)
                                        : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Text + Media */}
                    {post.text && (
                        <div className="whitespace-pre-wrap break-words mt-2 px-6 text-white">
                            {post.text}
                        </div>
                    )}
                    {/* Không bọc mediaBlock với padding, cho hình ảnh/video sát 2 bên */}
                    {fileCount > 0 && (
                        <div className="w-full" style={{ padding: 0, margin: 0 }}>{mediaBlock}</div>
                    )}

                    {/* React, comment, share */}
                    <div className="px-6 pt-2">
                        <PostReactButton
                            post={post}
                            onReact={(
                                reactionName,
                                prevReaction,
                                postId
                            ) => {
                                onReact(reactionName, prevReaction, post._id);
                            }}
                            onComment={() => { /* no-op */ }}
                            onShare={onShare ? () => onShare(post._id) : () => { /* no-op */ }}
                            isOnPost={true}
                        />
                    </div>

                    {/* Comment section: cho phép xem hết tất cả các comment */}
                    <div className="px-6 pb-6">
                        <div className="border-t border-[#343434] pt-2 mt-2">
                            <div className="text-white font-semibold mb-2">Bình luận</div>
                            <div className="flex flex-col gap-3 pr-1">
                                {/* Danh sách pending comment (trước), rồi comment thật */}
                                {[...pendingComments, ...comments]
                                    .slice(0, visibleComments)
                                    .map((comment: AnyComment) => {
                                        const isPending = 'pending' in comment && comment.pending === true;
                                        return (
                                            <div key={comment.id} className="flex gap-2 items-start opacity-100 relative">
                                                <Avatar
                                                    size={32}
                                                    src={comment.user.avatar}
                                                    className="rounded-full flex-shrink-0"
                                                />
                                                <div className="flex-1 bg-[#242528] rounded-xl px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-white">{comment.user.name}</span>
                                                        <span className="text-xs text-[#b0b3b8]">@{comment.user.username}</span>
                                                        <span className="text-xs text-[#b0b3b8] ml-2">
                                                            {getTimeAgo(comment.createdAt)}
                                                        </span>
                                                        {isPending && (
                                                            <span className="ml-2 text-xs text-blue-400 flex items-center animate-pulse" title="Đang gửi">
                                                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="mr-1">
                                                                    <circle cx="12" cy="12" r="10" stroke="#60A5FA" strokeWidth="2" opacity="0.5"/>
                                                                    <path d="M12 6v6l4 2" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
                                                                </svg>
                                                                Đang gửi...
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`text-white text-sm whitespace-pre-line mt-1 ${isPending ? "opacity-80 italic" : ""}`}>{comment.content}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {/* Nút xem thêm khi còn comment chưa hiển thị */}
                                {hasMoreComments && (
                                    <button
                                        className="bg-[#333] text-white px-4 py-2 rounded-full shadow hover:bg-[#444] self-center"
                                        style={{ marginTop: 8 }}
                                        onClick={() =>
                                            setVisibleComments((c) =>
                                                Math.min(
                                                    c + 5,
                                                    pendingComments.length + comments.length
                                                )
                                            )
                                        }
                                    >
                                        Xem thêm bình luận
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Comment Input dưới đáy, luôn hiển thị, luôn nằm ngoài scroll */}
                <div
                    style={{
                        position: "sticky",
                        bottom: 0,
                        zIndex: 30,
                        background: "#1e1e1f",
                        maxHeight: MAX_TEXTAREA_HEIGHT, // giữ tổng wrapper max 500px như yêu cầu
                    }}
                >
                    <div
                        className="w-full flex items-center gap-2 border-t border-[#343434] bg-[#1e1e1f] px-4 py-3 rounded-b-3xl"
                        style={{
                            minHeight: 72,
                            overflow: "visible",
                            maxHeight: MAX_TEXTAREA_HEIGHT,
                        }}
                    >
                        <Avatar
                            src={myAvatar}
                            size={40}
                            className="rounded-full flex-shrink-0"
                        />
                        <div
                            className={`flex-1 flex items-center rounded-xl bg-[#242528] transition-colors`}
                            style={{
                                paddingLeft: 4,
                                paddingRight: 6,
                                paddingTop: 2,
                                paddingBottom: 2,
                                minHeight: 40,
                                maxHeight: MAX_TEXTAREA_HEIGHT,
                                transition: "box-shadow 0.2s, border 0.2s, height 0.1s",
                                border: isCommentInputFocused ? "1px solid #2563EB" : "1px solid transparent",
                            }}
                        >
                            <textarea
                                ref={commentInputRef}
                                value={commentInput}
                                onFocus={() => setIsCommentInputFocused(true)}
                                onBlur={() => setIsCommentInputFocused(false)}
                                onChange={e => setCommentInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 text-white px-1 py-2 outline-none resize-none custom-scroll"
                                placeholder="Nhập bình luận..."
                                maxLength={2000}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    minHeight: 36,
                                    width: "100%",
                                    height: "auto",
                                    overflowY: "auto",
                                    resize: "none",
                                    maxHeight: MAX_TEXTAREA_HEIGHT,
                                }}
                                rows={1}
                            />
                        </div>
                        <button
                            type="button"
                            className={`ml-1 px-4 py-2 rounded-full cursor-pointer font-semibold transition ${commentInput.trim() === ""
                                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            style={{ minWidth: 74 }}
                            disabled={commentInput.trim() === ""}
                            onClick={handleSendComment}
                        >
                            Gửi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Showpost;
