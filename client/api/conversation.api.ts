import instance from "@/axiosConfig";

export async function apiGetIncomeUser(userId: string) {
    try {
        const res = await instance.get(`/conversation/incomeUser/${userId}`);
        return res.data;
    } catch (err) {
        console.error("apiGetIncomeUser error:", err);
        throw err;
    }
}

export async function getConversationDetail(payload: { userId: string, conversationId?: string, cursorAt?: string }) {
    try {
        console.warn(payload)
        const res = await instance.post(`/conversation/getConversationDetail`, payload);
        return res.data;
    } catch (err) {
        console.error("getConversationId error:", err);
        throw err;
    }
}

// Hàm loadMessage lấy tin nhắn với conversationId và cursorAt
export async function loadMessage(conversationId: string, cursorAt?: string) {
    try {
        const res = await instance.post(`/conversation/loadMessage`, {
            conversationId,
            cursorAt,
        });
        return res.data;
    } catch (err) {
        console.error("loadMessage error:", err);
        throw err;
    }
}


export async function getMessageList() {
    try {
        const res = await instance.get(`/conversation/getMessageList`);
        return res.data;
    } catch (err) {
        console.error("getMessageListByUserId error:", err);
        throw err;
    }
}

