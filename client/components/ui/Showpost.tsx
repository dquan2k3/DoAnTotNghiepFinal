import React, { useEffect, useState } from "react";

interface FileType {
    file_url: string;
    file_type: "image" | "video" | string;
}
interface PostData {
    _id?: string;
    avatar40x40?: string;
    avatar?: string;
    createdAt?: string;
    files?: FileType[];
    text?: string;
    name?: string;
    myReact?: "like" | null;
    likeCount?: number;
    hasShared?: boolean;
    shareCount?: number;
    commentCount?: number;
    username?: string;
    isMyPost?: boolean;
}
interface ShowPostProps {
    isShow: boolean;
    onClose: (val: boolean) => void;
    post: PostData;
    onPostDeleted?: (id: string) => void;
    onLike: (postId: string) => void; // Đã sửa: chỉ nhận postId
}

const Showpost: React.FC<ShowPostProps> = ({
    isShow,
    onClose,
    post,
    onPostDeleted,
    onLike,
}) => {
    const [visible, setVisible] = useState<boolean>(isShow);
    const [curReact, setCurReact] = useState<"like" | null>(post.myReact ?? null);
    const [curReactCount, setCurReactCount] = useState<number>(post.likeCount ?? 0);
    const [imgPreview, setImgPreview] = useState<{ show: boolean, url: string, type: string } | null>(null);

    useEffect(() => {
        setVisible(isShow);
        if (isShow) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isShow]);

    useEffect(() => {
        setCurReact(post.myReact ?? null);
        setCurReactCount(typeof post.likeCount === "number" ? post.likeCount : 0);
    }, [post]);

    if (!visible) {
        return null;
    }

    const files: FileType[] = Array.isArray(post.files) ? post.files : [];

    const onMediaClick = (url: string, type: string) => {
        setImgPreview({ show: true, url, type });
    };

    // time handler (short logic for now)
    const getTimeString = (createdAt?: string): string => {
        if (!createdAt) return "";
        const now = new Date();
        const created = new Date(createdAt);
        const diff = now.getTime() - created.getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (diff > oneDay) {
            return created.toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
        }
        const minutes = Math.floor(diff / (60 * 1000));
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        return `${hours} giờ trước`;
    };

    // Like handler - gọi onLike chỉ truyền id
    const handleLike = () => {
        if (curReact === "like") {
            setCurReact(null);
            setCurReactCount(prev => (prev > 0 ? prev - 1 : 0));
        } else {
            setCurReact("like");
            setCurReactCount(prev => prev + 1);
        }
        if (post._id) {
            onLike(post._id); // chỉ truyền post._id
        }
    };

    // Render media layout for the files (up to 4 show, rest as "+x")
    const renderFiles = () => {
        if (files.length === 0) return null;
        if (files.length === 1) {
            return (
                <div className="showpost-media1">
                    {files[0].file_type === "video" ? (
                        <video controls className="showpost-mediafile" src={files[0].file_url} />
                    ) : (
                        <img
                            src={files[0].file_url}
                            className="showpost-mediafile"
                            alt="post"
                            onClick={() => onMediaClick(files[0].file_url, files[0].file_type)}
                            style={{ cursor: "pointer" }}
                        />
                    )}
                </div>
            );
        }
        if (files.length === 2) {
            return (
                <div className="showpost-media2">
                    {files.slice(0, 2).map((f, i) =>
                        f.file_type === "video" ? (
                            <video key={i} controls className="showpost-mediafile" src={f.file_url} />
                        ) : (
                            <img
                                key={i}
                                src={f.file_url}
                                alt="post"
                                className="showpost-mediafile"
                                onClick={() => onMediaClick(f.file_url, f.file_type)}
                                style={{ cursor: "pointer" }}
                            />
                        ),
                    )}
                </div>
            );
        }
        // For 3 or more
        const filesToShow = files.slice(0, 4);
        return (
            <div className={`showpost-media${filesToShow.length}`}>
                {filesToShow.map((f, i) => {
                    if (i === 3 && files.length > 4) {
                        // Last item + count overlay
                        return (
                            <div className="showpost-mediafile-wrap showpost-mediafile-more" key={i} style={{ position: "relative" }}>
                                {f.file_type === "video" ? (
                                    <video controls className="showpost-mediafile" src={f.file_url} />
                                ) : (
                                    <img
                                        src={f.file_url}
                                        alt="post"
                                        className="showpost-mediafile"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => onMediaClick(f.file_url, f.file_type)}
                                    />
                                )}
                                <div
                                    className="showpost-mediafile-morelabel"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "rgba(0,0,0,0.55)",
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "2rem",
                                        fontWeight: "bold",
                                        color: "#fff",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => onMediaClick(f.file_url, f.file_type)}
                                >
                                    +{files.length - 4}
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="showpost-mediafile-wrap" key={i}>
                            {f.file_type === "video" ? (
                                <video controls className="showpost-mediafile" src={f.file_url} />
                            ) : (
                                <img
                                    src={f.file_url}
                                    alt="post"
                                    className="showpost-mediafile"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => onMediaClick(f.file_url, f.file_type)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="showpost-modal showpost-modal-bg"
            tabIndex={0}
            style={{ zIndex: 9999, position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            {/* img preview */}
            {imgPreview?.show && (
                <div className="showpost-preview" style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.83)",
                    zIndex: 10000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div className="showpost-preview-content" style={{
                        background: "#fff",
                        borderRadius: "14px",
                        boxShadow: "0 2px 30px rgb(0 0 0 / 12%)",
                        padding: 24,
                        maxWidth: 600,
                        width: "90vw",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}>
                        <div style={{ marginBottom: 16 }}>
                            {imgPreview.type === "video" ? (
                                <video
                                    src={imgPreview.url}
                                    controls
                                    style={{ maxWidth: 500, borderRadius: 12, maxHeight: 400 }}
                                />
                            ) : (
                                <img
                                    src={imgPreview.url}
                                    alt=""
                                    style={{ maxWidth: 500, borderRadius: 12, maxHeight: 400 }}
                                />
                            )}
                        </div>
                        <button
                            className="showpost-preview-closebtn"
                            style={{
                                padding: "8px 24px",
                                fontSize: '16px',
                                fontWeight: 600,
                                border: "none",
                                background: "#1877f2",
                                color: "#fff",
                                borderRadius: 6,
                                cursor: "pointer"
                            }}
                            onClick={() => setImgPreview(null)}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            <div className="showpost-mainwrap" style={{
                background: "#18191a",
                borderRadius: 18,
                boxShadow: "0 2px 30px rgb(0 0 0 / 24%)",
                minWidth: "370px",
                width: 580,
                maxWidth: "98vw",
                maxHeight: "91vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
            }}>
                {/* Header Section */}
                <div className="showpost-header" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 18,
                    borderBottom: "1px solid #242526",
                    position: "relative",
                }}>
                    <div style={{ flexShrink: 0 }}>
                        <img
                            src={post.avatar40x40 || post.avatar}
                            alt="avatar"
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: "100%",
                                objectFit: "cover",
                                background: "#f2f3f5"
                            }}
                        />
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#fff", fontSize: 18, lineHeight: 1.1, marginBottom: 2 }}>
                            {post.name}
                        </div>
                        <div style={{ color: "#b0b3b8", fontSize: 14 }}>
                            {getTimeString(post.createdAt)}
                        </div>
                    </div>
                    <button
                        className="showpost-closebtn"
                        aria-label="Đóng"
                        style={{
                            background: "none",
                            border: "none",
                            width: 40,
                            height: 40,
                            borderRadius: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#b0b3b8",
                            fontSize: 22,
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            cursor: "pointer"
                        }}
                        onClick={() => {
                            setVisible(false);
                            onClose(false);
                        }}
                    >
                        <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <line x1="5" y1="5" x2="19" y2="19" stroke="#b0b3b8" strokeWidth="2" />
                            <line x1="19" y1="5" x2="5" y2="19" stroke="#b0b3b8" strokeWidth="2" />
                        </svg>
                    </button>
                </div>
                {/* Content Section */}
                <div className="showpost-content" style={{
                    flex: 1,
                    overflowY: "auto",
                    minHeight: 0,
                    padding: "8px 0 0 0",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    {post.text && (
                        <div
                            className="showpost-text"
                            style={{
                                color: "#e4e6ea",
                                fontSize: 16,
                                padding: "0 20px 10px 20px",
                                whiteSpace: "pre-line",
                                wordBreak: "break-word"
                            }}
                        >
                            {post.text}
                        </div>
                    )}
                    {files.length > 0 && (
                        <div className="showpost-media" style={{ padding: "0 20px 12px 20px" }}>
                            {renderFiles()}
                        </div>
                    )}
                </div>
                {/* Action Bar */}
                <div className="showpost-actions" style={{
                    borderTop: "1px solid #242526",
                    padding: "16px 22px 16px 22px",
                    display: "flex",
                    gap: 22,
                    alignItems: "center",
                    background: "#18191a"
                }}>
                    <button
                        className="showpost-action-btn"
                        onClick={handleLike}
                        style={{
                            background: curReact === "like" ? "#1877f2" : "rgba(31, 35, 41, 0.55)",
                            color: curReact === "like" ? "#fff" : "#e4e6ea",
                            fontWeight: 600,
                            border: "none",
                            borderRadius: 8,
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 24px",
                            cursor: "pointer",
                            transition: ".15s"
                        }}
                    >
                        <svg
                            width="22"
                            height="22"
                            fill={curReact === "like" ? "#fff" : "none"}
                            stroke="#1877f2"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path d="M7 10V5.5A3.5 3.5 0 0 1 13.71 3.6l.29.21c.64.45 1.25.96 1.83 1.53C17.24 6.02 18 7.4 18 8.88V10m-11 9.5A2.5 2.5 0 0 1 4.5 17V12a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v5A2.5 2.5 0 0 1 19 19.5" />
                        </svg>
                        {curReact === "like" ? "Đã thích" : "Thích"}
                        {curReactCount > 0 && (
                            <span style={{ marginLeft: 4, color: "#fff" }}>{curReactCount}</span>
                        )}
                    </button>
                    <div
                        className="showpost-action-btn"
                        style={{
                            background: "rgba(31, 35, 41, 0.48)",
                            color: "#e4e6ea",
                            fontWeight: 600,
                            border: "none",
                            borderRadius: 8,
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 17px",
                            cursor: "default"
                        }}
                    >
                        <svg width={21} height={21} fill="none" stroke="#b0b3b8" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M21 11.5a8.38 8.38 0 0 1-8.38 8.38c-1.73 0-3.39-.51-4.76-1.37l-5.08 1.64 1.64-5.08A8.38 8.38 0 1 1 21 11.5z" />
                        </svg>
                        Bình luận
                        {typeof post.commentCount === "number" && post.commentCount > 0 ? (
                            <span style={{ marginLeft: 4, color: "#b0b3b8" }}>{post.commentCount}</span>
                        ) : null}
                    </div>
                    <div
                        className="showpost-action-btn"
                        style={{
                            background: "rgba(31, 35, 41, 0.48)",
                            color: "#e4e6ea",
                            fontWeight: 600,
                            border: "none",
                            borderRadius: 8,
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 17px",
                            cursor: "default"
                        }}
                    >
                        <svg width={22} height={22} fill="none" stroke="#b0b3b8" strokeWidth={2} viewBox="0 0 24 24">
                            <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Chia sẻ
                        {typeof post.shareCount === "number" && post.shareCount > 0 ? (
                            <span style={{ marginLeft: 4, color: "#b0b3b8" }}>{post.shareCount}</span>
                        ) : null}
                    </div>
                </div>
            </div>
            <style jsx global>{`
        .showpost-modal-bg {
          animation: showpost-bg-in 0.15s;
        }
        @keyframes showpost-bg-in {
          from { background: rgba(0,0,0,0);}
          to   { background: rgba(0,0,0,0.78);}
        }
        .showpost-mainwrap::-webkit-scrollbar {
          display: none;
        }
        .showpost-media1,
        .showpost-media2,
        .showpost-media3,
        .showpost-media4 {
          display: flex;
          gap: 8px;
        }
        .showpost-media1 {
          justify-content: center;
          align-items: center;
        }
        .showpost-media2 > * {
          width: 50%;
        }
        .showpost-media3,
        .showpost-media4 {
          flex-wrap: wrap;
        }
        .showpost-mediafile-wrap {
          flex: 1 1 46%;
          min-width: 44%;
          margin: 2px;
          position: relative;
        }
        .showpost-mediafile {
          width: 100%;
          height: 170px;
          object-fit: cover;
          border-radius: 12px;
          background: #222;
          display: block;
        }
        .showpost-media1 .showpost-mediafile {
          min-width: 280px; max-width: 100%; max-height: 410px; height: auto;
        }
        .showpost-media2 .showpost-mediafile,
        .showpost-media3 .showpost-mediafile,
        .showpost-media4 .showpost-mediafile {
          max-height: 170px;
        }
      `}</style>
        </div>
    );
};

export default Showpost;
