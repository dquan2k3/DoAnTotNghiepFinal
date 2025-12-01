import { postModel, postFileModel } from '../model/post';
import { bioModel } from '../model/bio';
import { profileModel } from '../model/profile';
import { Relationship } from '../model/relationship';
import { postReactModel } from '../model/post';
import { postCommentModel } from '../model/post';
import { postShareModel } from '../model/post';
import { postReportedModel } from '../model/post'

const fs = require("fs");
const cloudinary = require('../config/cloudinaryConfig');
const streamifier = require("streamifier");

/**
 * Uploads a file buffer to Cloudinary (image/video) and returns the result.
 * @param {Buffer} fileBuffer
 * @param {String} fileMimetype
 * @param {String} publicId
 * @returns {Promise<Object>} - { secure_url, resource_type }
 */
function uploadFileBufferToCloudinary(fileBuffer, fileMimetype, publicId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "posts",
                public_id: publicId,
                resource_type: fileMimetype && fileMimetype.startsWith("video") ? "video" : "image",
                overwrite: true,
            },
            (error, result) => {
                if (error) {
                    console.error("Upload error:", error.message);
                    return reject(error);
                }
                resolve(result);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}

export const uploadPost = async (req, res) => {
    try {
        // userId from req.user.id (must be set before by middleware)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Thiếu userId" });
        }

        const text = req.body.text || '';
        const privacy = req.body.privacy || 'public';
        const files = req.files || [];

        const newPost = await postModel.create({
            user: userId,
            text: text,
            privacy: privacy,
        });

        let fileResults = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let fileBuffer = null;
            if (file.buffer) {
                fileBuffer = file.buffer;
            } else if (file.path && fs.existsSync(file.path)) {
                fileBuffer = fs.readFileSync(file.path);
            }
            if (!fileBuffer) continue;
            const publicId = `post_${newPost._id}_${i}`;
            const uploadResult = await uploadFileBufferToCloudinary(fileBuffer, file.mimetype, publicId);
            const postFile = await postFileModel.create({
                post_id: newPost._id,
                file_url: uploadResult.secure_url,
                file_type: uploadResult.resource_type,
                order_index: i
            });
            fileResults.push({
                file_url: postFile.file_url,
                file_type: postFile.file_type,
                order_index: postFile.order_index
            });
        }

        console.log("Post uploaded:", {
            _id: newPost._id,
            user: newPost.user,
            text: newPost.text,
            privacy: newPost.privacy,
            createdAt: newPost.createdAt,
            updatedAt: newPost.updatedAt,
            files: fileResults
        });
        res.status(200).json({
            success: true,
            message: "Đăng bài thành công",
            post: {
                _id: newPost._id,
                user: newPost.user,
                text: newPost.text,
                privacy: newPost.privacy,
                createdAt: newPost.createdAt,
                updatedAt: newPost.updatedAt,
                files: fileResults
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};

const emptyReacts = { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };

export const getProfilePosts = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res.status(400).json({ success: false, message: "Thiếu userId" });
        }

        // Cho phép client truyền thêm userId qua query hoặc body (ưu tiên: query > body > mặc định là chính mình)
        let profileUserId = req.query.userId || req.body?.userId || currentUserId;

        // Lấy post của profileUserId, nhưng các thông tin phụ (react/share của bản thân) dùng currentUserId
        const posts = await postModel.find({ user: profileUserId }).sort({ createdAt: -1 }).lean();
        const postIds = posts.map(p => p._id);

        const files = await postFileModel.find({ post_id: { $in: postIds } }).sort({ order_index: 1 }).lean();
        const postIdToFiles = {};
        for (const f of files) {
            const key = String(f.post_id);
            if (!postIdToFiles[key]) postIdToFiles[key] = [];
            postIdToFiles[key].push({ file_url: f.file_url, file_type: f.file_type, order_index: f.order_index });
        }

        const reactStats = await postReactModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: { post: "$post", react: "$react" }, count: { $sum: 1 } } }
        ]);
        const postIdToReactCounts = {};
        for (const stat of reactStats) {
            const postId = String(stat._id.post);
            const reactName = stat._id.react;
            if (!postIdToReactCounts[postId]) {
                postIdToReactCounts[postId] = { ...emptyReacts };
            }
            postIdToReactCounts[postId][reactName] = stat.count;
        }

        // My react = react của currentUserId trên những post này
        const myReacts = await postReactModel.find({ post: { $in: postIds }, user: currentUserId }).lean();
        const postIdToMyReact = {};
        myReacts.forEach(r => {
            postIdToMyReact[String(r.post)] = r.react;
        });

        const commentCountStats = await postCommentModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToCommentCount = {};
        for (const stat of commentCountStats) {
            postIdToCommentCount[String(stat._id)] = stat.count;
        }

        const shareCountStats = await postShareModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToShareCount = {};
        for (const stat of shareCountStats) {
            postIdToShareCount[String(stat._id)] = stat.count;
        }

        // Kiểm tra xem currentUserId đã share những post này chưa
        const sharedByUser = await postShareModel.find({ post: { $in: postIds }, user: currentUserId }).lean();
        const postIdToHasShared = {};
        sharedByUser.forEach(s => {
            postIdToHasShared[String(s.post)] = true;
        });

        // Không load relationship trong phiên bản này
        const result = posts.map(p => {
            const reactCounts = postIdToReactCounts[String(p._id)] || emptyReacts;
            const myReact = postIdToMyReact[String(p._id)] || null;
            const commentCount = postIdToCommentCount[String(p._id)] || 0;
            const shareCount = postIdToShareCount[String(p._id)] || 0;
            const hasShared = !!postIdToHasShared[String(p._id)];

            return {
                _id: p._id,
                user: p.user,
                text: p.text,
                privacy: p.privacy,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                files: postIdToFiles[String(p._id)] || [],
                reactCounts,
                myReact,
                commentCount,
                hasShared,
                shareCount,
            };
        });

        return res.status(200).json({ success: true, posts: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};


export const getMyPosts2 = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Thiếu userId" });
        }

        const posts = await postModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
        const postIds = posts.map(p => p._id);
        const files = await postFileModel.find({ post_id: { $in: postIds } }).sort({ order_index: 1 }).lean();

        const postIdToFiles = {};
        for (const f of files) {
            const key = String(f.post_id);
            if (!postIdToFiles[key]) postIdToFiles[key] = [];
            postIdToFiles[key].push({ file_url: f.file_url, file_type: f.file_type, order_index: f.order_index });
        }

        const postUserIds = [...new Set(posts.map(p => String(p.user)))];
        let relationships = [];
        if (postUserIds.length > 0) {
            relationships = await Relationship.find({
                $or: [
                    { requester: { $in: postUserIds }, recipient: userId },
                    { recipient: { $in: postUserIds }, requester: userId }
                ]
            }).lean();
        }
        const relMap = {};
        for (const rel of relationships) {
            relMap[`${String(rel.requester)}_${String(rel.recipient)}`] = rel;
            relMap[`${String(rel.recipient)}_${String(rel.requester)}`] = rel; // để tra 2 chiều
        }

        const result = posts.map(p => {
            let relationship = null;
            if (relMap[`${userId}_${String(p.user)}`]) {
                relationship = relMap[`${userId}_${String(p.user)}`];
            } else if (relMap[`${String(p.user)}_${userId}`]) {
                relationship = relMap[`${String(p.user)}_${userId}`];
            }
            return {
                _id: p._id,
                user: p.user,
                text: p.text,
                privacy: p.privacy,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                files: postIdToFiles[String(p._id)] || [],
                relationship: relationship
                    ? {
                        requester: relationship.requester,
                        recipient: relationship.recipient,
                        status: relationship.status
                    }
                    : {
                        requester: "relationship.requester",
                        recipient: "relationship.recipient",
                        status: "relationship.status"
                    }
            };
        });

        return res.status(200).json({ success: true, posts: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};


// API: Lấy chi tiết bài post theo postId, dùng token để trả về thông tin react của user, các comment của bài viết, tổng số comment, và tổng số lượt share + đã share chưa
export const getSinglePost = async (req, res) => {
    try {
        const postId = (req.body && req.body.postId) || (req.query && req.query.postId);
        if (!postId) {
            return res.status(400).json({ success: false, message: "Thiếu postId" });
        }

        // userId from req.user.id (nullable, for myReact/hasShared)
        const userId = req.user?.id;

        // Lấy post
        const post = await postModel.findById(postId).lean();
        if (!post) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }

        // Lấy files
        const files = await postFileModel.find({ post_id: postId }).sort({ order_index: 1 }).lean();
        const filesList = files.map(f => ({
            file_url: f.file_url,
            file_type: f.file_type,
            order_index: f.order_index
        }));

        // Lấy tổng số lượng react từng loại
        const reactStats = await postReactModel.aggregate([
            { $match: { post: post._id } },
            { $group: { _id: "$react", count: { $sum: 1 } } }
        ]);
        const reactCounts = { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
        for (const stat of reactStats) {
            reactCounts[stat._id] = stat.count;
        }

        // Lấy react của user hiện tại (nếu có userId)
        let myReact = null;
        if (userId) {
            const myReactDoc = await postReactModel.findOne({ post: post._id, user: userId }).lean();
            if (myReactDoc) {
                myReact = myReactDoc.react;
            }
        }

        // Lấy thông tin user đăng bài (bio + profile)
        let bioUser = null;
        let profileUser = null;
        if (post.user) {
            const bio = await bioModel.findOne(
                { userid: post.user },
                'userid avatar cover avatarCroppedArea coverCroppedArea'
            ).lean();
            const profile = await profileModel.findOne(
                { user: post.user },
                'user username name'
            ).lean();
            if (bio) {
                bioUser = {
                    avatar: bio.avatar,
                    cover: bio.cover,
                    avatarCroppedArea: bio.avatarCroppedArea,
                    coverCroppedArea: bio.coverCroppedArea
                };
            }
            if (profile) {
                profileUser = {
                    username: profile.username,
                    name: profile.name
                };
            }
        }

        // Lấy comment của bài post, tối đa 20 comment mới nhất
        const comments = await postCommentModel.find({ post: post._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const commentUserIdsSet = new Set();
        comments.forEach(c => {
            if (c.user) {
                commentUserIdsSet.add(String(c.user));
            }
        });
        const commentUserIds = Array.from(commentUserIdsSet);

        let commentBioMap = {};
        let commentProfileMap = {};
        if (commentUserIds.length > 0) {
            const commentBios = await bioModel.find(
                { userid: { $in: commentUserIds } },
                'userid avatar avatarCroppedArea'
            ).lean();
            commentBioMap = commentBios.reduce((map, obj) => {
                map[String(obj.userid)] = {
                    avatar: obj.avatar,
                    avatarCroppedArea: obj.avatarCroppedArea
                };
                return map;
            }, {});

            const commentProfiles = await profileModel.find(
                { user: { $in: commentUserIds } },
                'user name'
            ).lean();
            commentProfileMap = commentProfiles.reduce((map, obj) => {
                map[String(obj.user)] = {
                    name: obj.name
                };
                return map;
            }, {});
        }

        const commentList = comments.map(c => {
            const userBio = commentBioMap[String(c.user)] || {};
            const userProfile = commentProfileMap[String(c.user)] || {};
            if (Object.keys(userBio).length === 0 && Object.keys(userProfile).length === 0) {
                return {
                    _id: c._id,
                    user: null,
                    text: c.text,
                    createdAt: c.createdAt
                };
            }
            return {
                _id: c._id,
                user: {
                    _id: c.user,
                    name: userProfile.name || null,
                    avatar: userBio.avatar || null,
                    avatarCroppedArea: userBio.avatarCroppedArea || null
                },
                text: c.text,
                createdAt: c.createdAt
            };
        });

        const commentCount = await postCommentModel.countDocuments({ post: post._id });

        const shareCount = await postShareModel.countDocuments({ post: post._id });

        let hasShared = false;
        if (userId) {
            const existingShare = await postShareModel.findOne({
                post: post._id,
                user: userId
            }).lean();
            if (existingShare) hasShared = true;
        }

        return res.status(200).json({
            success: true,
            post: {
                _id: post._id,
                user: post.user,
                text: post.text,
                privacy: post.privacy,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                files: filesList,
                reactCounts,
                myReact,
                bioUser,
                profileUser,
                comments: commentList,
                commentCount,
                shareCount,
                hasShared
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error && error.message ? error.message : String(error)
        });
    }
};

// Lấy tất cả bài viết (homeFeed, tất cả user)
export const getAllPosts = async (req, res) => {
    try {
        // userId from req.user.id for myReact/hasShared/relationship etc
        const userId = req.user?.id || null;

        const posts = await postModel.find({}).sort({ createdAt: -1 }).lean();
        const postIds = posts.map(p => p._id);

        const files = await postFileModel.find({ post_id: { $in: postIds } }).sort({ order_index: 1 }).lean();
        const postIdToFiles = {};
        for (const f of files) {
            const key = String(f.post_id);
            if (!postIdToFiles[key]) postIdToFiles[key] = [];
            postIdToFiles[key].push({ file_url: f.file_url, file_type: f.file_type, order_index: f.order_index });
        }

        const reactStats = await postReactModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: { post: "$post", react: "$react" }, count: { $sum: 1 } } }
        ]);
        const postIdToReactCounts = {};
        for (const stat of reactStats) {
            const postId = String(stat._id.post);
            const reactName = stat._id.react;
            if (!postIdToReactCounts[postId]) {
                postIdToReactCounts[postId] = { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
            }
            postIdToReactCounts[postId][reactName] = stat.count;
        }

        let postIdToMyReact = {};
        if (userId) {
            const myReacts = await postReactModel.find({ post: { $in: postIds }, user: userId }).lean();
            postIdToMyReact = {};
            myReacts.forEach(r => {
                postIdToMyReact[String(r.post)] = r.react;
            });
        }

        const userIds = [...new Set(posts.map(p => String(p.user)))];

        const bios = await bioModel.find(
            { userid: { $in: userIds } },
            'userid avatar cover avatarCroppedArea coverCroppedArea'
        ).lean();
        const userIdToBio = {};
        for (const bio of bios) {
            userIdToBio[String(bio.userid)] = {
                avatar: bio.avatar,
                cover: bio.cover,
                avatarCroppedArea: bio.avatarCroppedArea,
                coverCroppedArea: bio.coverCroppedArea
            };
        }

        const profiles = await profileModel.find(
            { user: { $in: userIds } },
            'user username name'
        ).lean();
        const userIdToProfile = {};
        for (const profile of profiles) {
            userIdToProfile[String(profile.user)] = {
                username: profile.username,
                name: profile.name
            };
        }

        let relationships = [];
        if (userIds.length > 0) {
            relationships = await Relationship.find({
                $or: [
                    { requester: { $in: userIds }, recipient: { $in: userIds } },
                    { recipient: { $in: userIds }, requester: { $in: userIds } }
                ]
            }).lean();
        }
        const relMap = {};
        for (const rel of relationships) {
            relMap[`${String(rel.requester)}_${String(rel.recipient)}`] = rel;
            relMap[`${String(rel.recipient)}_${String(rel.requester)}`] = rel;
        }

        const shareStats = await postShareModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToShareCount = {};
        for (const stat of shareStats) {
            postIdToShareCount[String(stat._id)] = stat.count;
        }

        let hasShareMap = {};
        if (userId) {
            const userShares = await postShareModel.find({ post: { $in: postIds }, user: userId }).lean();
            userShares.forEach(s => {
                hasShareMap[String(s.post)] = true;
            });
        }

        const commentCountArr = await postCommentModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToCommentCount = {};
        for (const stat of commentCountArr) {
            postIdToCommentCount[String(stat._id)] = stat.count;
        }

        const result = posts.map(p => {
            let relationship = null;
            if (userId) {
                if (relMap[`${String(userId)}_${String(p.user)}`]) {
                    relationship = relMap[`${String(userId)}_${String(p.user)}`];
                } else if (relMap[`${String(p.user)}_${String(userId)}`]) {
                    relationship = relMap[`${String(p.user)}_${String(userId)}`];
                }
            }
            const reactCounts = postIdToReactCounts[String(p._id)] || { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
            const myReact = userId ? (postIdToMyReact[String(p._id)] || null) : null;
            const hasShared = !!hasShareMap[String(p._id)];
            const shareCount = postIdToShareCount[String(p._id)] || 0;
            const commentCount = postIdToCommentCount[String(p._id)] || 0;

            return {
                _id: p._id,
                user: p.user,
                text: p.text,
                privacy: p.privacy,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                files: postIdToFiles[String(p._id)] || [],
                reactCounts,
                myReact,
                bioUser: userIdToBio[String(p.user)] || null,
                profileUser: userIdToProfile[String(p.user)] || null,
                relationship: relationship
                    ? {
                        _id: relationship._id,
                        requester: relationship.requester,
                        recipient: relationship.recipient,
                        status: relationship.status
                    }
                    : null,
                hasShared,
                shareCount,
                commentCount
            };
        });

        return res.status(200).json({ success: true, posts: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};

// Viết hàm getUserPost: lấy danh sách bài viết theo userId được truyền lên qua params (GET /api/getUserPost?userId=xxx)
// Load thêm myReact (reaction của người hiện tại lên post -- nếu có token)
export const getUserPost = async (req, res) => {
    try {
        const userId = req.query && req.query.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu userId' });
        }

        // myReact, hasShared theo user hiện tại (req.user.id, có thể undefined)
        const currentUserId = req.user?.id || null;

        const posts = await postModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
        const postIds = posts.map(p => p._id);

        const files = await postFileModel.find({ post_id: { $in: postIds } }).sort({ order_index: 1 }).lean();
        const postIdToFiles = {};
        for (const f of files) {
            const key = String(f.post_id);
            if (!postIdToFiles[key]) postIdToFiles[key] = [];
            postIdToFiles[key].push({ file_url: f.file_url, file_type: f.file_type, order_index: f.order_index });
        }

        const reactStats = await postReactModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: { post: "$post", react: "$react" }, count: { $sum: 1 } } }
        ]);
        const postIdToReactCounts = {};
        for (const stat of reactStats) {
            const postIdx = String(stat._id.post);
            const reactName = stat._id.react;
            if (!postIdToReactCounts[postIdx]) {
                postIdToReactCounts[postIdx] = { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
            }
            postIdToReactCounts[postIdx][reactName] = stat.count;
        }

        // myReact theo currentUserId
        let postIdToMyReact = {};
        if (currentUserId && postIds.length > 0) {
            const myReacts = await postReactModel.find({
                post: { $in: postIds },
                user: currentUserId
            }).lean();
            for (const react of myReacts) {
                postIdToMyReact[String(react.post)] = react.react;
            }
        }

        // shareCount
        const shareStats = await postShareModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToShareCount = {};
        for (const stat of shareStats) {
            postIdToShareCount[String(stat._id)] = stat.count;
        }

        // hasShared
        let postIdToHasShared = {};
        if (currentUserId && postIds.length > 0) {
            const myShares = await postShareModel.find({
                post: { $in: postIds },
                user: currentUserId
            }).lean();
            for (const share of myShares) {
                postIdToHasShared[String(share.post)] = true;
            }
        }

        // commentCount
        const commentCountArr = await postCommentModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToCommentCount = {};
        for (const stat of commentCountArr) {
            postIdToCommentCount[String(stat._id)] = stat.count;
        }

        const bio = await bioModel.findOne(
            { userid: userId },
            'userid avatar cover avatarCroppedArea coverCroppedArea'
        ).lean();

        const profile = await profileModel.findOne(
            { user: userId },
            'user username name'
        ).lean();

        const result = posts.map(p => {
            const reactCounts = postIdToReactCounts[String(p._id)] || { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
            const filesArr = postIdToFiles[String(p._id)] || [];
            const shareCount = postIdToShareCount[String(p._id)] || 0;
            const commentCount = postIdToCommentCount[String(p._id)] || 0;
            const hasShared = !!postIdToHasShared[String(p._id)];
            const myReact = currentUserId ? (postIdToMyReact[String(p._id)] || null) : null;

            return {
                _id: p._id,
                user: p.user,
                text: p.text,
                privacy: p.privacy,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                files: filesArr,
                reactCounts,
                myReact,
                shareCount,
                commentCount,
                hasShared,
                bioUser: bio || null,
                profileUser: profile || null
            };
        });

        return res.status(200).json({ success: true, posts: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};


// ==================== searchPost ====================
// Tìm các bài post có text chứa `key`, filter cho phép sort theo newest/oldest, lọc theo thời gian
// Thời gian có giá trị: "1 ngày trước", "3 ngày trước", "1 tuần trước", ...
export const searchPost = async (req, res) => {
    try {
        let { key = '', sort, filter = {} } = req.body || {};
        let sortby = sort || filter.sortby;
        let time = (filter && typeof filter === 'object') ? filter.time : undefined;

        let query = {};
        if (key && key.trim() !== '') {
            query.text = { $regex: key.trim(), $options: 'i' };
        }

        if (time && typeof time === 'string' && time.trim().length > 0) {
            let now = new Date();
            let targetDate = null;
            let matched = time.trim().match(/^(\d+)([hdwmy])$/i);
            if (matched) {
                let value = parseInt(matched[1], 10);
                let unit = matched[2].toLowerCase();
                if (!isNaN(value) && value > 0) {
                    switch (unit) {
                        case 'h': targetDate = new Date(now.getTime() - value * 60 * 60 * 1000); break;
                        case 'd': targetDate = new Date(now.getTime() - value * 24 * 60 * 60 * 1000); break;
                        case 'w': targetDate = new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000); break;
                        case 'm': { let d = new Date(now); d.setMonth(d.getMonth() - value); targetDate = d; break; }
                        case 'y': { let d = new Date(now); d.setFullYear(d.getFullYear() - value); targetDate = d; break; }
                        default: break;
                    }
                }
            }
            if (!targetDate) {
                if (time.includes('ngày trước')) {
                    let n = parseInt(time.trim().split(' ')[0], 10) || 1;
                    targetDate = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
                } else if (time.includes('tuần trước') || time.includes('week')) {
                    let n = parseInt(time.trim().split(' ')[0], 10) || 1;
                    targetDate = new Date(now.getTime() - n * 7 * 24 * 60 * 60 * 1000);
                } else if (time.includes('tháng trước') || time.includes('month')) {
                    let n = parseInt(time.trim().split(' ')[0], 10) || 1;
                    let m = new Date(now);
                    m.setMonth(m.getMonth() - n);
                    targetDate = m;
                }
            }
            if (targetDate) {
                query.createdAt = { $gte: targetDate };
            }
        }

        let sortOpt = { createdAt: -1 };
        if (typeof sortby === 'string') sortby = sortby.trim().toLowerCase();
        if (
            sortby === 'asc' ||
            sortby === 'oldest' ||
            sortby === '1' ||
            sortby === 1
        ) {
            sortOpt = { createdAt: 1 };
        } else if (
            sortby === 'desc' ||
            sortby === 'newest' ||
            sortby === '-1' ||
            sortby === -1
        ) {
            sortOpt = { createdAt: -1 };
        }

        // userId from req.user.id (may be undefined)
        const userId = req.user?.id || null;

        const posts = await postModel.find(query).sort(sortOpt).lean();
        const postIds = posts.map(p => p._id);

        const files = await postFileModel.find({ post_id: { $in: postIds } }).sort({ order_index: 1 }).lean();
        const postIdToFiles = {};
        for (const f of files) {
            const key = String(f.post_id);
            if (!postIdToFiles[key]) postIdToFiles[key] = [];
            postIdToFiles[key].push({ file_url: f.file_url, file_type: f.file_type, order_index: f.order_index });
        }

        const reactStats = await postReactModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: { post: "$post", react: "$react" }, count: { $sum: 1 } } }
        ]);
        const postIdToReactCounts = {};
        for (const stat of reactStats) {
            const postIdX = String(stat._id.post);
            const reactName = stat._id.react;
            if (!postIdToReactCounts[postIdX]) {
                postIdToReactCounts[postIdX] = { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
            }
            postIdToReactCounts[postIdX][reactName] = stat.count;
        }

        let postIdToMyReact = {};
        if (userId) {
            const myReacts = await postReactModel.find({ post: { $in: postIds }, user: userId }).lean();
            myReacts.forEach(r => {
                postIdToMyReact[String(r.post)] = r.react;
            });
        }

        const userIds = [...new Set(posts.map(p => String(p.user)))];

        const bios = await bioModel.find(
            { userid: { $in: userIds } },
            'userid avatar cover avatarCroppedArea coverCroppedArea'
        ).lean();
        const userIdToBio = {};
        for (const bio of bios) {
            userIdToBio[String(bio.userid)] = {
                avatar: bio.avatar,
                cover: bio.cover,
                avatarCroppedArea: bio.avatarCroppedArea,
                coverCroppedArea: bio.coverCroppedArea
            };
        }

        const profiles = await profileModel.find(
            { user: { $in: userIds } },
            'user username name'
        ).lean();
        const userIdToProfile = {};
        for (const profile of profiles) {
            userIdToProfile[String(profile.user)] = {
                username: profile.username,
                name: profile.name
            };
        }

        let relationships = [];
        if (userIds.length > 0) {
            relationships = await Relationship.find({
                $or: [
                    { requester: { $in: userIds }, recipient: { $in: userIds } },
                    { recipient: { $in: userIds }, requester: { $in: userIds } }
                ]
            }).lean();
        }
        const relMap = {};
        for (const rel of relationships) {
            relMap[`${String(rel.requester)}_${String(rel.recipient)}`] = rel;
            relMap[`${String(rel.recipient)}_${String(rel.requester)}`] = rel;
        }

        const shareStats = await postShareModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToShareCount = {};
        for (const stat of shareStats) {
            postIdToShareCount[String(stat._id)] = stat.count;
        }

        let hasShareMap = {};
        if (userId) {
            const userShares = await postShareModel.find({ post: { $in: postIds }, user: userId }).lean();
            userShares.forEach(s => {
                hasShareMap[String(s.post)] = true;
            });
        }

        const commentCountArr = await postCommentModel.aggregate([
            { $match: { post: { $in: postIds } } },
            { $group: { _id: "$post", count: { $sum: 1 } } }
        ]);
        const postIdToCommentCount = {};
        for (const stat of commentCountArr) {
            postIdToCommentCount[String(stat._id)] = stat.count;
        }

        const result = posts.map(p => {
            let relationship = null;
            if (userId) {
                if (relMap[`${String(userId)}_${String(p.user)}`]) {
                    relationship = relMap[`${String(userId)}_${String(p.user)}`];
                } else if (relMap[`${String(p.user)}_${String(userId)}`]) {
                    relationship = relMap[`${String(p.user)}_${String(userId)}`];
                }
            }
            const reactCounts = postIdToReactCounts[String(p._id)] || { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
            const myReact = userId ? (postIdToMyReact[String(p._id)] || null) : null;
            const hasShared = !!hasShareMap[String(p._id)];
            const shareCount = postIdToShareCount[String(p._id)] || 0;
            const commentCount = postIdToCommentCount[String(p._id)] || 0;

            return {
                _id: p._id,
                user: p.user,
                text: p.text,
                privacy: p.privacy,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                files: postIdToFiles[String(p._id)] || [],
                reactCounts,
                myReact,
                bioUser: userIdToBio[String(p.user)] || null,
                profileUser: userIdToProfile[String(p.user)] || null,
                relationship: relationship
                    ? {
                        _id: relationship._id,
                        requester: relationship.requester,
                        recipient: relationship.recipient,
                        status: relationship.status
                    }
                    : null,
                hasShared,
                shareCount,
                commentCount,
            };
        });

        return res.status(200).json({ success: true, posts: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};


export const getImage = async (req, res) => {
    try {
        // userId from req.user.id
        let userId = req.user?.id;
        // allow override by req.body.userId, but req.user.id always set
        if (req.body && req.body.userId) {
            userId = req.body.userId;
        }
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không có userId, truy cập bị từ chối' });
        }

        const posts = await postModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
        if (!posts || posts.length === 0) {
            return res.status(200).json({ success: true, images: [] });
        }

        const postIds = posts.map(post => post._id);

        const postFiles = await postFileModel.find({
            post_id: { $in: postIds },
            file_type: { $regex: /image/i }
        }).sort({ post_id: 1, order_index: 1 }).lean();

        const postIdToFiles = {};
        for (const file of postFiles) {
            const pid = String(file.post_id);
            if (!postIdToFiles[pid]) postIdToFiles[pid] = [];
            postIdToFiles[pid].push(file);
        }

        const images = [];
        for (const post of posts) {
            const pid = String(post._id);
            const files = postIdToFiles[pid] || [];
            for (const file of files) {
                images.push({
                    url: cloudinary.url(file.file_url, { width: 185, height: 185, crop: "fill" }),
                    post_id: file.post_id
                });
            }
        }

        res.status(200).json({
            success: true,
            images: images
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

export const getVideo = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không có userId, truy cập bị từ chối' });
        }
        const posts = await postModel.find({ user: userId }).lean();
        if (!posts || posts.length === 0) {
            return res.status(200).json({ success: true, videos: [] });
        }

        const postIds = posts.map(post => post._id);
        const postFiles = await postFileModel.find({
            post_id: { $in: postIds },
            file_type: { $regex: /^video\// }
        }).lean();

        const videos = postFiles.map(file => {
            return cloudinary.url(file.file_url, { resource_type: "video" });
        });

        res.status(200).json({
            success: true,
            videos: videos
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
/*
 * API: React to post (theo kiểu bảng riêng: post_reacts)
 * Body: { postId, react }
 * Chỉ duy nhất 1 react cho 1 user và 1 post (nếu cùng react thì bỏ react, nếu khác thì update)
 */


export const reactPost = async (req, res) => {
    try {
        // userId from req.user.id
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Thiếu userId" });
        }

        const { postId, react } = req.body;

        if (!postId) {
            return res.status(400).json({ success: false, message: "Thiếu postId" });
        }

        // Nếu react là null hoặc undefined thì xóa tất cả các react của user cho bài post này
        if (react === null || react === undefined) {
            await postReactModel.deleteMany({ post: postId, user: userId });
            return res.status(200).json({
                success: true,
                message: "Đã xóa react",
                type: "unreact"
            });
        }

        const validReacts = ["like", "love", "fun", "sad", "angry"];
        if (!validReacts.includes(react)) {
            return res.status(400).json({ success: false, message: "Kiểu react không hợp lệ" });
        }

        const postExisted = await postModel.findById(postId);
        if (!postExisted) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }

        const existingReact = await postReactModel.findOne({ post: postId, user: userId });

        if (existingReact) {
            existingReact.react = react;
            await existingReact.save();
            return res.status(200).json({
                success: true,
                message: "Đã cập nhật react",
                type: "update",
                react: existingReact.react
            });
        } else {
            const newReact = new postReactModel({
                post: postId,
                user: userId,
                react: react
            });
            await newReact.save();
            return res.status(200).json({
                success: true,
                message: "React thành công",
                type: "add",
                react: newReact.react
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};


export const commentPost = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Thiếu userId" });
        }

        const { postId, comment } = req.body;
        if (!postId || !comment || typeof comment !== "string" || !comment.trim()) {
            return res.status(400).json({ success: false, message: "Thiếu postId hoặc nội dung comment" });
        }

        const post = await postModel.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }

        const newComment = await postCommentModel.create({
            post: postId,
            user: userId,
            text: comment.trim()
        });

        await newComment.populate([
            {
                path: "user",
                select: "name avatar"
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Bình luận thành công",
            comment: {
                _id: newComment._id,
                post: newComment.post,
                user: newComment.user,
                text: newComment.text,
                createdAt: newComment.createdAt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};


export const sharePost = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Thiếu userId" });
        }

        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ success: false, message: "Thiếu postId" });
        }

        const post = await postModel.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }

        const existingShare = await postShareModel.findOne({
            user: userId,
            post: postId
        });

        if (existingShare) {
            await postShareModel.deleteOne({ _id: existingShare._id });
            return res.status(200).json({
                success: true,
                message: "Đã huỷ chia sẻ bài viết",
                share: null
            });
        }

        const newShare = await postShareModel.create({
            user: userId,
            post: postId
        });

        return res.status(200).json({
            success: true,
            message: "Chia sẻ bài viết thành công",
            share: {
                _id: newShare._id,
                user: newShare.user,
                post: newShare.post,
                createdAt: newShare.createdAt,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};



/**
 * API: Đếm số lượng react của từng loại trên 1 bài post
 * Query: ?postId=...
 * Trả về: { total: số react tổng, reactCounts: { like: n, love: m, ... } }
 */
export const loadCountReact = async (req, res) => {
    try {
        const { postId } = req.query;
        if (!postId) {
            return res.status(400).json({ success: false, message: "Thiếu postId" });
        }

        const reactStats = await postReactModel.aggregate([
            { $match: { post: typeof postId === 'string' ? require('mongoose').Types.ObjectId(postId) : postId } },
            { $group: { _id: "$react", count: { $sum: 1 } } }
        ]);

        const reactCounts = { like: 0, love: 0, fun: 0, sad: 0, angry: 0 };
        let total = 0;

        reactStats.forEach(rs => {
            reactCounts[rs._id] = rs.count;
            total += rs.count;
        });

        return res.status(200).json({
            success: true,
            total,
            reactCounts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};


/**
 * API: Báo cáo bài viết (reportPost)
 * Body: { postId }
 * - Lưu báo cáo vào postReportedModel chỉ với postId, không phân biệt người report.
 */
export const reportPost = async (req, res) => {
    try {
        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ success: false, message: "Thiếu postId" });
        }

        const newReport = new postReportedModel({
            postId,
            reportedAt: new Date(),
        });
        await newReport.save();

        res.status(200).json({ success: true, message: "Đã báo cáo bài viết thành công." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};

/**
 * API: Xóa bài viết (deletePost)
 * Body: { postId }
 * - Xóa bài viết khỏi postModel, không kiểm tra quyền ở đây, chỉ nhận postId.
 */
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ success: false, message: "Thiếu postId" });
        }

        const deleted = await postModel.findByIdAndDelete(postId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết cần xóa." });
        }

        res.status(200).json({ success: true, message: "Đã xóa bài viết thành công." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error && error.message ? error.message : String(error) });
    }
};
