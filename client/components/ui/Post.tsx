"use client";
import React, { useEffect, useState } from "react";
import PostingPopup from "./PostingPopup";
import Showpost from "./Showpost";
import { apiGetProfilePost, apiUploadPost } from "@/api/post.api";

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      <span className="animate-pulse text-[#58A2F7]">.</span>
      <span className="animate-pulse text-[#58A2F7] delay-150">.</span>
      <span className="animate-pulse text-[#58A2F7] delay-300">.</span>
    </span>
  );
}

type PostProps = {
  pageType?: string;
  userId?: string;
  name?: string;
  username?: string;
  avatar?: string;
  avatarCroppedArea?: any;
};

// Modified to include myReact as only "like" | null | undefined
type PostTypeWithMyReact = {
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
  myReact?: "like" | null;
};

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
};

export default function Post({
  userId,
  name = "Bạn",
  username,
  avatar,
  avatarCroppedArea,
}: PostProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textToPost, setTextToPost] = useState("");
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState("");

  // ShowImage popup state
  const [showImage, setShowImage] = useState(false);
  const [showImageFiles, setShowImageFiles] = useState<any[]>([]);
  const [showImageIdx, setShowImageIdx] = useState(0);

  // Showpost popup state
  const [showPostPopup, setShowPostPopup] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingPosts(true);
    setError('');
    const fetchPosts = userId ? () => apiGetProfilePost(userId) : () => apiGetProfilePost();
    fetchPosts()
      .then((res: any) => {
        if (res?.data?.posts) {
          const patchedPosts = res.data.posts.map((p: any) => ({
            ...p,
            liked: typeof p.liked === "boolean" ? p.liked : false,
            likeCount: typeof p.likeCount === "number" ? p.likeCount : 0,
            commentCount: typeof p.commentCount === "number" ? p.commentCount : 0,
            shareCount: typeof p.shareCount === "number" ? p.shareCount : 0,
            files: Array.isArray(p.files) ? p.files : [],
            avatar: p.avatar || avatar,
            name: p.name || name,
            username: p.username || username,
          }));
          setPosts(patchedPosts);
        } else {
          setPosts([]);
        }
      })
      .catch((err) => {
        setError("Không tải được bài viết.");
        setPosts([]);
        console.error('apiGetProfilePost error:', err);
      })
      .finally(() => {
        setLoadingPosts(false);
      });
    // eslint-disable-next-line
  }, [userId]);

  // Fix type so it matches the expected type by Showpost
  const selectedPost: PostTypeWithMyReact | null = selectedPostId
    ? (() => {
      const post = posts.find((p) => p._id === selectedPostId);
      return post
        ? {
          ...post,
          myReact: post.liked ? "like" : null as "like" | null,
        }
        : null;
    })()
    : null;

  function Avatar({ src, size, className }: { src?: string; size?: number; className?: string }) {
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

  const handleCloseShowImage = () => {
    setShowImage(false);
    setShowImageFiles([]);
    setShowImageIdx(0);
  };

  const handleOpenShowImage = ({
    files,
    fileIdx,
  }: {
    files: any[];
    fileIdx: number;
  }) => {
    setShowImageFiles(files);
    setShowImageIdx(fileIdx);
    setShowImage(true);
  };

  const handleOpenShowPost = (post: PostType) => {
    setSelectedPostId(post._id);
    setShowPostPopup(true);
  };

  const handleCloseShowPost = () => {
    setShowPostPopup(false);
    setSelectedPostId(null);
  };

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
          className={`w-full h-full object-cover rounded-lg ${extra.className || ""}`}
          style={extra.style}
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
        className={`w-full h-full object-cover rounded-lg cursor-pointer ${extra.className || ""}`}
        style={extra.style}
        onClick={() =>
          handleOpenShowImage({
            files: [file],
            fileIdx: 0,
          })
        }
      />
    );
  };

  type PostData = {
    text: string;
    files?: File[];
    [key: string]: any;
  };

  type PostResult = {
    success: boolean;
    error?: string;
  };

  const handlePost = async (postData: PostData): Promise<PostResult> => {
    if (!postData || !postData.text || !postData.text.trim()) {
      return { success: false, error: "EMPTY_POST" };
    }
    setIsLoading(true);
    try {
      const res = await apiUploadPost(postData);
      if (res && res.data && res.data.success && res.data.post) {
        const postFromApi = res.data.post;
        const displayFiles = Array.isArray(postFromApi.files)
          ? postFromApi.files.map((f: any) => ({ ...f }))
          : [];
        const newPost: PostType = {
          ...postFromApi,
          files: displayFiles,
          liked: false,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          avatar: postFromApi.avatar || avatar,
          name: postFromApi.name || name,
          username: postFromApi.username || username,
        };
        setPosts((prev) => [newPost, ...prev]);
        setTextToPost("");
        return { success: true };
      }
    } catch (err) {
      console.error("Error when uploading post:", err);
      return { success: false, error: "UPLOAD_FAILED" };
    } finally {
      setIsLoading(false);
    }
    return { success: false };
  };

  const handleClickOpenPostingPopup = () => {
    if (!isLoading) {
      setIsPosting(true);
    }
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((item) => {
        if (item._id === postId) {
          const isLiked = !!item.liked;
          return {
            ...item,
            liked: !item.liked,
            likeCount: isLiked ? Math.max(0, (item.likeCount ?? 0) - 1) : (item.likeCount ?? 0) + 1,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="flex w-full gap-6 justify-center">
      {/* ShowImage popup */}
      {showImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col justify-center items-center">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full flex flex-col items-center">
            <div className="mb-4">ShowImage:</div>
            <div className="mb-2">
              <img
                src={showImageFiles[showImageIdx]?.file_url}
                alt="img"
                className="max-h-[400px] max-w-full rounded"
              />
            </div>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
              onClick={handleCloseShowImage}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Showpost popup */}
      {showPostPopup && selectedPost && (
        <Showpost
          isShow={showPostPopup}
          post={selectedPost}
          onClose={handleCloseShowPost}
          onLike={handleLike}
        />
      )}

      {/* PostingPopup - hidden if userId is present */}
      {!userId && (
        <PostingPopup
          isPosting={isPosting}
          onClose={() => {
            if (!isLoading) setIsPosting(false);
          }}
          onPost={handlePost}
          textToPost={textToPost}
          setTextToPost={setTextToPost}
        />
      )}

      <div className="w-full flex flex-col gap-4">
        {/* New post input area - hidden if userId */}
        {!userId && (
          <div className="bg-[#252728] rounded-lg p-4 flex flex-col items-center">
            <div className="w-full min-h-[56px] flex gap-4">
              <div className="w-[56px] h-[56px] flex items-center justify-center">
                <Avatar src={avatar} size={45} className="rounded-full" />
              </div>
              <div className="flex-1 min-h-[56px] flex items-center justify-center">
                <div
                  className="min-h-[45px] text-[#7E7F81] font-[500] text-[18px] w-full flex items-center bg-[#333334] rounded-3xl px-4 py-2 cursor-pointer hover:bg-[#484849]"
                  onClick={handleClickOpenPostingPopup}
                  title={textToPost && textToPost.length > 140 ? textToPost : undefined}
                  style={{ wordBreak: "break-all", whiteSpace: "pre-line" }}
                >
                  {isLoading ? (
                    <span className="flex items-center font-medium text-[#58A2F7]">
                      Đang đăng tải bài viết
                      <LoadingDots />
                    </span>
                  ) : textToPost ? (
                    textToPost.length > 140
                      ? textToPost.slice(0, 140) + "..."
                      : textToPost
                  ) : (
                    "Đăng bài viết mới?"
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách bài viết */}
        <div className="flex flex-col gap-4">
          {loadingPosts && (
            <div className="bg-[#252728] rounded-lg p-4 text-white">
              <span className="text-[#58A2F7] font-semibold">Đang tải bài viết</span>
              <LoadingDots />
            </div>
          )}
          {!loadingPosts && error && (
            <div className="bg-[#252728] rounded-lg p-4 text-red-400">{error}</div>
          )}
          {!loadingPosts && !error && posts && posts.length === 0 && (
            <div className="bg-[#252728] rounded-lg p-4 text-[#b0b3b8]">Chưa có bài viết nào</div>
          )}
          {!loadingPosts &&
            !error &&
            posts &&
            posts.length > 0 &&
            posts.map((p, idx) => {
              const files = Array.isArray(p.files) ? p.files : [];
              const fileCount = files.length;
              let mediaBlock = null;
              if (fileCount === 1) {
                mediaBlock = (
                  <div className="mt-3 w-full">
                    {renderMedia(files[0], 0, {
                      style: {
                        height: "auto",
                        maxHeight: "800px",
                        minHeight: "200px",
                        objectFit: "contain",
                      },
                    })}
                  </div>
                );
              } else if (fileCount === 2) {
                mediaBlock = (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {files.map((f, idx2) =>
                      renderMedia(f, idx2, { className: "h-64" })
                    )}
                  </div>
                );
              } else if (fileCount === 3) {
                mediaBlock = (
                  <div className="mt-3 grid grid-rows-2 gap-2" style={{ height: "400px" }}>
                    <div className="row-span-1">
                      {renderMedia(files[0], 0, {
                        className: "w-full h-full",
                        style: { height: "196px" },
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-2 row-span-1">
                      {files.slice(1, 3).map((f, idx2) =>
                        renderMedia(f, idx2 + 1, {
                          className: "w-full h-full",
                          style: { height: "196px" },
                        })
                      )}
                    </div>
                  </div>
                );
              } else if (fileCount === 4) {
                mediaBlock = (
                  <div
                    className="mt-3 grid grid-cols-2 grid-rows-2 gap-2"
                    style={{ height: "400px" }}
                  >
                    {files.slice(0, 4).map((f, idx2) =>
                      renderMedia(f, idx2, {
                        className: "w-full h-full",
                        style: { height: "196px" },
                      })
                    )}
                  </div>
                );
              } else if (fileCount >= 5) {
                const moreCount = fileCount - 5;
                mediaBlock = (
                  <div className="mt-3 flex flex-col gap-2" style={{ height: "400px" }}>
                    <div className="flex gap-2" style={{ height: "196px" }}>
                      {files.slice(0, 2).map((f, idx2) => (
                        <div key={idx2} className="w-1/2 h-full">
                          {renderMedia(f, idx2, {
                            className: "w-full h-full",
                            style: { height: "100%" },
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2" style={{ height: "196px" }}>
                      {files.slice(2, 5).map((f, idx2) => {
                        if (idx2 === 2 && moreCount > 0) {
                          return (
                            <div key={idx2} className="relative w-1/3 h-full">
                              {renderMedia(f, idx2 + 2, {
                                className: "w-full h-full",
                                style: { height: "100%" },
                              })}
                              <div
                                className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg cursor-pointer"
                                onClick={() =>
                                  handleOpenShowImage({
                                    files: files,
                                    fileIdx: idx2 + 2,
                                  })
                                }
                              >
                                <span className="text-white text-2xl font-bold">
                                  +{moreCount}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={idx2} className="w-1/3 h-full">
                            {renderMedia(f, idx2 + 2, {
                              className: "w-full h-full",
                              style: { height: "100%" },
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              const postName = p.name || name || "Bạn";
              const postAvatar = p.avatar || avatar;
              return (
                <div key={p._id} className="bg-[#252728] rounded-lg p-4 text-white">
                  <div className="w-full flex items-center">
                    <Avatar
                      src={postAvatar}
                      size={40}
                      className="rounded-full flex-shrink-0 mr-3"
                    />
                    <div className="leading-none flex justify-center flex-col">
                      <div className="font-semibold mb-1">{postName}</div>
                      <div className="text-sm text-[#b0b3b8]">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                  {p.text && (
                    <div className="whitespace-pre-wrap break-words mt-2">
                      {p.text}
                    </div>
                  )}
                  {fileCount > 0 && mediaBlock}

                  <div className="mt-3 flex items-center justify-between text-[#b0b3b8] text-sm">
                    <div className="flex items-center gap-4">
                      <span>
                        <span role="img" aria-label="like" className="mr-1">
                          👍
                        </span>
                        {p.likeCount ?? 0} lượt thích
                      </span>
                      <span>
                        <span role="img" aria-label="comment" className="mr-1">
                          💬
                        </span>
                        {p.commentCount ?? 0} bình luận
                      </span>
                    </div>
                    <div>
                      <span>
                        <span role="img" aria-label="share" className="mr-1">
                          🔄
                        </span>
                        {p.shareCount ?? 0} lượt chia sẻ
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center w-full border-t border-[#373839] pt-2 gap-2">
                    <button
                      onClick={() => handleLike(p._id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-sm transition cursor-pointer
                        ${p.liked
                          ? "bg-[#3c5cb1] text-blue-400"
                          : "hover:bg-[#34373c] text-[#b0b3b8]"
                        }
                      `}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill={p.liked ? "#3c82f6" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M14 9V5a3 3 0 0 0-6 0v4M5 10h14a2 2 0 0 1 1.99 2.226l-1.03 7.184A3 3 0 0 1 17 22H7a3 3 0 0 1-2.96-2.59L3 12.31A2 2 0 0 1 5 10z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {p.liked ? "Đã thích" : "Thích"}
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-sm hover:bg-[#34373c] text-[#b0b3b8] cursor-pointer"
                      onClick={() => handleOpenShowPost(p)}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <ellipse cx="12" cy="10" rx="6" ry="4" />
                        <path d="M12 14c-2.7 0-4.78-.56-5.85-1.59A3 3 0 0 0 6 18h12a3 3 0 0 0-.15-5.59C16.78 13.44 14.7 14 12 14z" />
                      </svg>
                      Bình luận
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-sm hover:bg-[#34373c] text-[#b0b3b8] cursor-pointer"
                      disabled
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path
                          d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
                          strokeLinecap="round" strokeLinejoin="round"
                        />
                        <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Chia sẻ
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
