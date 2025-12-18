import jwt from 'jsonwebtoken';
const { Relationship } = require('../model/relationship');

exports.sendFriendRequest = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Không có token, truy cập bị từ chối' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const myId = decoded.id;

        const { recipient, message } = req.body;

        if (!recipient) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin người nhận' });
        }
        if (myId === recipient) {
            return res.status(400).json({ success: false, message: 'Không thể gửi lời mời kết bạn cho chính mình' });
        }

        // Kiểm tra xem đã tồn tại mối quan hệ giữa 2 user này chưa (cả 2 chiều)
        let existing = await Relationship.findOne({
            $or: [
                { requester: myId, recipient: recipient },
                { requester: recipient, recipient: myId }
            ]
        });

        if (existing) {
            if (existing.status === 'blocked') {
                return res.status(403).json({ success: false, message: 'Không thể gửi lời mời kết bạn (bị chặn)', relationship: existing });
            }
            if (existing.status === 'pending') {
                return res.status(409).json({ success: false, message: 'Đã gửi lời mời kết bạn trước đó, đang chờ phản hồi', relationship: existing });
            }
            if (existing.status === 'accepted') {
                return res.status(409).json({ success: false, message: 'Hai bạn đã là bạn bè', relationship: existing });
            }
            // Nếu là rejected hoặc trạng thái khác, cho phép gửi lại

            // Nếu người gửi request mới khác với người gửi cũ, set wasRejected = false
            if (existing.status === 'rejected' || existing.wasRejected) {
                if (String(existing.requester) !== String(myId)) {
                    existing.wasRejected = false;
                }
            }

            // Cập nhật lại thông tin chung
            existing.requester = myId;
            existing.recipient = recipient;
            existing.message = message;
            existing.status = 'pending';

            await existing.save();

            // Lấy lại relationship mới nhất
            existing = await Relationship.findById(existing._id);

            return res.status(200).json({
                success: true,
                message: 'Đã gửi lời mời kết bạn',
                relationship: existing,
            });
        }

        // Gán bản thân là requester, id truyền vào là recipient, trạng thái pending
        let relationship = new Relationship({
            requester: myId,
            recipient,
            message,
            status: 'pending'
        });

        await relationship.save();

        // Lấy lại relationship mới nhất
        relationship = await Relationship.findById(relationship._id);

        return res.status(200).json({ success: true, message: 'Đã gửi lời mời kết bạn', relationship });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server khi gửi lời mời kết bạn' });
    }
};

// Hàm lấy thông tin quan hệ giữa 2 user
exports.getRelationship = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Không có token, truy cập bị từ chối' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { otherUserId } = req.query;
        if (!otherUserId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin người dùng cần kiểm tra' });
        }

        // Tìm quan hệ giữa userId và otherUserId (cả 2 chiều)
        const relationship = await Relationship.findOne({
            $or: [
                { requester: userId, recipient: otherUserId },
                { requester: otherUserId, recipient: userId }
            ]
        });

        if (!relationship) {
            return res.status(200).json({ success: true, relationship: null, message: 'Chưa có quan hệ' });
        }

        return res.status(200).json({ success: true, relationship });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin quan hệ' });
    }
};

// Hàm xóa quan hệ giữa user hiện tại và người khác (unfriend hoặc hủy lời mời)
exports.cancelRelationship = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Không có token, truy cập bị từ chối' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { relationshipId } = req.body;
        if (!relationshipId) {
            return res.status(400).json({ success: false, message: 'Thiếu relationshipId cần xóa' });
        }

        // Tìm relationship trước
        let relationship = await Relationship.findById(relationshipId);

        if (!relationship) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy quan hệ để xóa', relationship: null });
        }

        // Nếu trạng thái là pending (đang chờ), coi là hủy lời mời kết bạn
        if (relationship.status === 'pending') {
            await Relationship.findOneAndDelete({ _id: relationshipId });
            return res.status(200).json({
                success: true,
                message: 'Đã hủy lời mời kết bạn',
                relationship: null
            });
        }

        // Nếu trạng thái là accepted (đã là bạn bè), coi là xóa bạn
        if (relationship.status === 'accepted') {
            await Relationship.findOneAndDelete({ _id: relationshipId });
            return res.status(200).json({
                success: true,
                message: 'Đã xóa bạn',
                relationship: null
            });
        }

        // Nếu trạng thái wasRejected = true, chuyển thành rejected thay vì xóa
        if (relationship.wasRejected === true) {
            relationship.status = 'rejected';
            await relationship.save();
            // Lấy lại relationship mới nhất
            relationship = await Relationship.findById(relationship._id);
            return res.status(200).json({
                success: true,
                message: 'Đã từ chối!',
                relationship
            });
        }

        // Nếu không, xóa relationship như bình thường
        const deletedRelationship = await Relationship.findOneAndDelete({
            _id: relationshipId,
        });

        if (!deletedRelationship) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy quan hệ để xóa', relationship: null });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa',
            relationship: null
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Lỗi server', relationship: null });
    }
};

// Chấp nhận lời mời kết bạn (cập nhật trạng thái là 'accepted' nếu trạng thái là 'pending' và user hiện tại là recipient)
exports.acceptFriendRequest = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Không có token, truy cập bị từ chối' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { relationshipId } = req.body;
        if (!relationshipId) {
            return res.status(400).json({ success: false, message: 'Thiếu relationshipId cần chấp nhận' });
        }

        // Tìm relationship và kiểm tra quyền chấp nhận
        let relationship = await Relationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời kết bạn', relationship: null });
        }

        if (
            relationship.status !== 'pending' ||
            String(relationship.recipient) !== String(userId)
        ) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chấp nhận lời mời này', relationship });
        }

        // Cập nhật trạng thái thành 'accepted' và lưu thời gian chấp nhận
        relationship.status = 'accepted';
        relationship.acceptedAt = new Date();
        relationship.wasRejected = false;
        await relationship.save();

        // Lấy lại relationship mới nhất
        relationship = await Relationship.findById(relationship._id);

        res.status(200).json({
            success: true,
            message: 'Đã chấp nhận lời mời kết bạn thành công',
            relationship
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Lỗi server khi chấp nhận lời mời kết bạn', relationship: null });
    }
};


// Từ chối lời mời kết bạn (cập nhật trạng thái là 'rejected' và wasRejected = true nếu trạng thái là 'pending' và user hiện tại là recipient)
exports.rejectFriendRequest = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Không có token, truy cập bị từ chối' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { relationshipId } = req.body;
        if (!relationshipId) {
            return res.status(400).json({ success: false, message: 'Thiếu relationshipId cần từ chối' });
        }

        // Tìm relationship và kiểm tra quyền từ chối
        let relationship = await Relationship.findById(relationshipId);
        if (!relationship) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời kết bạn', relationship: null });
        }

        if (
            relationship.status !== 'pending' ||
            String(relationship.recipient) !== String(userId)
        ) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền từ chối lời mời này', relationship });
        }

        // Cập nhật trạng thái thành 'rejected' và wasRejected = true
        relationship.status = 'rejected';
        relationship.wasRejected = true;
        await relationship.save();

        // Lấy lại relationship mới nhất
        relationship = await Relationship.findById(relationship._id);

        res.status(200).json({
            success: true,
            message: 'Đã từ chối lời mời kết bạn thành công',
            relationship
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Lỗi server khi từ chối lời mời kết bạn', relationship: null });
    }
};
