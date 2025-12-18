const { Server } = require("socket.io");
import jwt from "jsonwebtoken";
import { sendMessageHandler } from "./src/controller/conversation";

let io = null;

// Hàm truyền vào cookie string và trả về decoded user nếu có
function decodeUserFromCookie(cookieString) {
    if (!cookieString) return null;
    try {
        // cookieString: 'token=xxxx; abc=1'
        const cookiesArr = cookieString.split(';').map(c => c.trim());
        let token = null;
        for (let item of cookiesArr) {
            if (item.startsWith('token=')) {
                token = item.replace('token=', '');
                break;
            }
        }
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (err) {
        // Nếu verify không thành công
        return null;
    }
}

function registerSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        }
    });

    if (io) {
        console.log("[socket.io] Socket server initialized thành công 🚀");
    } else {
        console.error("[socket.io] Lỗi khi khởi tạo socket server!");
    }

    // Lưu mapping userId -> socketId để gửi tin nhắn riêng tư
    const userSockets = new Map();

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // Khi client thực hiện userConnect, back-end sẽ lấy userId từ token (cookie)
        socket.on("userConnect", (name) => {
            socket.data.name = name;

            console.log("Registered:", socket.data);

            const cookies = socket.handshake.headers.cookie;
            const decoded = decodeUserFromCookie(cookies);
            const userId = decoded?.id;
            if (userId) {
                userSockets.set(userId, socket.id);
                // lưu userId vào socket để hỗ trợ disconnect và làm senderId sau này
                socket.userId = userId;
                console.log(`mapped [BY TOKEN]: userId=${userId}, socketId=${socket.id}`);
            } else {
                console.warn("[userConnect] Không tìm thấy userId từ token trong cookie!");
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            if (socket.userId) {
                userSockets.delete(socket.userId);
            } else {
                // Fallback: tìm theo socket id nếu chưa map userId trên socket
                for (let [userId, socketId] of userSockets.entries()) {
                    if (socketId === socket.id) {
                        userSockets.delete(userId);
                        break;
                    }
                }
            }
        });

        // Xử lý gửi tin nhắn (PRIVATE)
        socket.on("sendMessage", async (data) => {
            try {
                // Dùng userId đã map trên socket làm senderId luôn, không nhận senderId từ client nữa
                const senderId = socket.userId;
                const { receiverId, message, conversationId } = data;

                // Bắt buộc phải có senderId, receiverId, message
                if (!senderId || !receiverId || !message) {
                    socket.emit("messageError", { error: "Missing senderId (mapped by backend), receiverId hoặc message" });
                    return;
                }

                // Gọi async sendMessageHandler để xử lý và lưu vào database
                let result;
                try {
                    result = await sendMessageHandler({ senderId, receiverId, message, conversationId });
                } catch (err) {
                    console.error("sendMessageHandler error:", err);
                    socket.emit("messageError", {
                        error: err && err.message ? err.message : "Failed to save message"
                    });
                    return;
                }

                // Chuẩn bị dữ liệu trả về
                let sendData = {
                    senderId: result.senderId,
                    message: result.message,
                    createdAt: result.createdAt,
                    ...(result.conversationId && { conversationId: result.conversationId })
                };


                console.log("MESSAGE DATA :", sendData);

                // Nếu có receiverId, gửi riêng tư
                const receiverSocketId = userSockets.get(receiverId);

                if (receiverSocketId) {
                    socket.to(receiverSocketId).emit("receiveMessage", sendData);
                    console.log(`Message sent privately to user ${receiverSocketId}`, { withCredentials: true });

                    if (result.conversationId) {
                        sendData = {
                            ...sendData,
                            receiverId: receiverId,
                        };
                        console.log(`Message sent privately to user sender`);
                        socket.emit("receiveMessage", sendData);
                    }
                } else {
                    console.log(`User ${receiverId} is not online`);
                    socket.emit("messageError", {
                        error: "User not online",
                        receiverId: receiverId
                    });
                }

                // Confirm tin nhắn đã gửi thành công, gửi lại cho sender
                socket.emit("messageSent", { success: true, data: sendData, withCredentials: true });

            } catch (error) {
                console.error("Error handling sendMessage:", error);
                socket.emit("messageError", { error: "Failed to send message" });
            }
        });

        // Xử lý join room (để chat nhóm)
        socket.on("joinRoom", (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
            socket.emit("roomJoined", { roomId, success: true });
        });

        socket.on("leaveRoom", (roomId) => {
            socket.leave(roomId);
            console.log(`Socket ${socket.id} left room ${roomId}`);
            socket.emit("roomLeft", { roomId, success: true });
        });

        // Gửi tin nhắn trong room
        socket.on("sendRoomMessage", (data) => {
            try {
                const { roomId, ...messageData } = data;
                socket.to(roomId).emit("receiveRoomMessage", messageData);
                socket.emit("messageSent", { success: true, data: messageData });

                // Log ra message gửi lên từ client giống @page.tsx (52-65)
                console.log(
                    "[sendRoomMessage] Data nhận được từ client:",
                    JSON.stringify(data, null, 2)
                );
                console.log(data)
            } catch (error) {
                console.error("Error handling sendRoomMessage:", error);
                socket.emit("messageError", { error: "Failed to send room message" });
            }
        });

    });
}

function getIO() {
    return io;
}

module.exports = {
    registerSocket,
    getIO,
    decodeUserFromCookie,
};
