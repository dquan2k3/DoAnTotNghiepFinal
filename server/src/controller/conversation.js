import { conversationModel, messageModel } from "../model/conversation";
import { bioModel } from "../model/bio";
import { profileModel } from "../model/profile";

// Lấy thông tin người dùng gửi tin nhắn (income user)
export const sendMessageHandler = async ({ senderId, receiverId, message, conversationId }) => {
    if (!senderId || !receiverId || !message) {
        throw new Error("Missing senderId, receiverId or message");
    }

    let conversation = null;
    let isNewConversation = false;

    if (conversationId) {
        conversation = await conversationModel.findById(conversationId);
        if (!conversation) throw new Error("Conversation not found with provided conversationId");
    } else {
        conversation = await conversationModel.findOne({
            type: "private",
            members: {
                $all: [
                    { $elemMatch: { userId: String(senderId) } },
                    { $elemMatch: { userId: String(receiverId) } }
                ]
            }
        });

        if (!conversation) {
            conversation = await conversationModel.create({
                type: "private",
                members: [
                    { userId: String(senderId), joinedAt: new Date() },
                    { userId: String(receiverId), joinedAt: new Date() }
                ]
            });
            isNewConversation = true;
        }
    }

    const newMessage = await messageModel.create({
        conversationId: conversation._id,
        sender: senderId,
        text: message,
        attachments: [],
        readBy: [
            { userId: senderId, readAt: new Date() }
        ]
    });

    let response = {
        senderId: newMessage.sender,
        message: newMessage.text,
        createdAt: newMessage.createdAt,
        ...(isNewConversation && { conversationId: conversation._id.toString() })
    };

    return response;
};

export const getIncomeUser = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Received userId:", userId);

        const bio = await bioModel.findOne(
            { userid: userId },
            'avatar avatarCroppedArea'
        );

        const info = await profileModel.findOne(
            { user: userId },
            'name -_id'
        );

        res.json({
            avatar: bio?.avatar || null,
            avatarCroppedArea: bio?.avatarCroppedArea || null,
            name: info?.name || null
        });
    } catch (error) {
        console.error("Error in getIncomeUser:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

export const getConversationDetail = async (req, res) => {
    try {
        const { userId, conversationId } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(400).json({ error: "Current user not found" });
        }
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        let conversation;
        // Nếu truyền conversationId thì tìm theo conversationId 
        if (conversationId !== undefined && conversationId !== null) {
            conversation = await conversationModel.findOne({
                _id: conversationId
            });

            // Nếu không tồn tại conversation, trả về messages rỗng, KHÔNG trả conversationId
            if (!conversation) {
                return res.json({ messages: [] });
            }

            // Tạm thời chưa truyền cursorAt, đặt cursorAt = now và limit 20 tin nhắn (lấy 20 tin nhắn mới nhất)
            const cursorAt = new Date();
            const messages = await messageModel.find({
                    conversationId: conversation._id,
                    createdAt: { $lt: cursorAt },
                })
                .sort({ createdAt: -1 })
                .limit(20)
                .select('sender text createdAt attachments readBy');

            // Vì sort giảm dần nên đảo ngược lại để render tăng dần thời gian
            const formattedMessages = messages.reverse().map(msg => ({
                id: msg._id.toString(),
                senderId: msg.sender,
                message: msg.text,
                createdAt: msg.createdAt,
                attachments: msg.attachments || [],
                readBy: msg.readBy || [],
            }));

            // KHÔNG trả về conversationId!
            return res.json({
                messages: formattedMessages
            });
        } else {
            // Nếu không truyền conversationId, tìm conversation giữa currentUserId và userId
            conversation = await conversationModel.findOne({
                type: "private",
                members: {
                    $all: [
                        { $elemMatch: { userId: String(currentUserId) } },
                        { $elemMatch: { userId: String(userId) } }
                    ]
                }
            });

            // Nếu không tồn tại conversation, trả về conversationId là null & rỗng message
            if (!conversation) {
                return res.json({ conversationId: null, messages: [] });
            }

            // Tạm thời chưa truyền cursorAt, đặt cursorAt = now và limit 20 tin nhắn (lấy 20 tin nhắn mới nhất)
            const cursorAt = new Date();
            const messages = await messageModel.find({
                    conversationId: conversation._id,
                    createdAt: { $lt: cursorAt },
                })
                .sort({ createdAt: -1 })
                .limit(20)
                .select('sender text createdAt attachments readBy');

            // Vì sort giảm dần nên đảo ngược lại để render tăng dần thời gian
            const formattedMessages = messages.reverse().map(msg => ({
                id: msg._id.toString(),
                senderId: msg.sender,
                message: msg.text,
                createdAt: msg.createdAt,
                attachments: msg.attachments || [],
                readBy: msg.readBy || [],
            }));

            return res.json({
                conversationId: conversation._id.toString(),
                messages: formattedMessages
            });
        }
    } catch (error) {
        console.error("Error in getConversationDetail:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Hàm loadMessage lấy tin nhắn với conversationId và cursorAt
export const loadMessage = async (req, res) => {
    try {
        const { conversationId, cursorAt } = req.body;

        if (!conversationId) {
            return res.status(400).json({ error: "conversationId is required" });
        }

        // Nếu không truyền cursorAt, lấy tất cả các tin nhắn mới nhất
        const cursor = cursorAt ? new Date(cursorAt) : new Date();

        // Lấy tối đa 20 tin nhắn cũ hơn cursorAt (hoặc mới nhất nếu không có)
        const messages = await messageModel.find({
            conversationId: conversationId,
            createdAt: { $lt: cursor }
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('sender text createdAt attachments readBy');

        // Đảo lại thứ tự tăng dần thời gian
        const formattedMessages = messages.reverse().map(msg => ({
            id: msg._id.toString(),
            senderId: msg.sender,
            message: msg.text,
            createdAt: msg.createdAt,
            attachments: msg.attachments || [],
            readBy: msg.readBy || [],
        }));

        return res.json({ messages: formattedMessages });
    } catch (error) {
        console.error("Error in loadMessage:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};


// Hàm lấy danh sách conversation theo userId, trả về conversationId, receiverId (nếu private), tên & avatar (theo mẫu getIncomeUser)
export const getMessageList = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        // Lấy tất cả conversation của user
        // Cần lấy type, members để biết receiverId (nếu private)
        const conversations = await conversationModel.find({
            'members.userId': String(userId)
        }).select('_id type members');

        // Để gom lại kết quả trả về
        const conversationList = await Promise.all(conversations.map(async (conv) => {
            let receiverId = null, receiverName = null, receiverAvatar = null, receiverAvatarCroppedArea = null;

            if (conv.type === "private") {
                // Tìm thành viên còn lại KHÔNG phải userId (là đối phương)
                const receiver = conv.members.find(m => String(m.userId) !== String(userId));
                receiverId = receiver?.userId || null;

                // Đúng: lấy avatar, name của đối phương, KHÔNG phải userId hiện tại
                if (receiverId) {
                    const bio = await bioModel.findOne(
                        { userid: receiverId },
                        'avatar avatarCroppedArea'
                    );
                    const info = await profileModel.findOne(
                        { user: receiverId },
                        'name -_id'
                    );
                    receiverAvatar = bio?.avatar || null;
                    receiverAvatarCroppedArea = bio?.avatarCroppedArea || null;
                    receiverName = info?.name || null;
                }
            }

            // Lấy 1 tin nhắn mới nhất trong conversation (dùng createdAt giảm dần, limit 1)
            const latestMessage = await messageModel.findOne({
                conversationId: conv._id
            })
            .sort({ createdAt: -1 })
            .select('sender text createdAt attachments readBy')
            .lean();

            let latestMsgFormatted = null;
            if (latestMessage) {
                latestMsgFormatted = {
                    id: latestMessage._id.toString(),
                    senderId: latestMessage.sender,
                    message: latestMessage.text,
                    createdAt: latestMessage.createdAt,
                    attachments: latestMessage.attachments || [],
                    readBy: latestMessage.readBy || [],
                };
            }

            return {
                conversationId: conv._id.toString(),
                type: conv.type,
                ...(conv.type === "private"
                    ? {
                        receiverId,
                        receiverName,
                        receiverAvatar,
                        receiverAvatarCroppedArea
                    }
                    : {}),
                latestMessage: latestMsgFormatted
            };
        }));

        return res.json({ conversationList });
    } catch (error) {
        console.error("Error in getMessageListByUserId:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};
