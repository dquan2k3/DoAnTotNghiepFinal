import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { accountModel } from "../model/auth";

// Đăng ký tài khoản mới
export const register = async (req, res) => {
    const { email, password, rePassword, name } = req.body;

    try {
        // Kiểm tra tài khoản đã tồn tại chưa
        const existingUser = await accountModel.findOne({ Email: email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
        }

        // Kiểm tra mật khẩu nhập lại
        if (password !== rePassword) {
            return res.status(400).json({ success: false, message: 'Mật khẩu nhập lại không khớp' });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo tài khoản mới
        const newUser = await accountModel.create({
            Email: email,
            Password: hashedPassword,
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            user: {
                id: newUser._id,
                email: newUser.Email,
                name: name,
                role: newUser.Role
            }
        });

    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Đăng nhập tài khoản
export const login = async (req, res) => {
    try {
        const { email, password, isKeepLogin } = req.body;
        const user = await accountModel.findOne({ Email: email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Tài khoản không tồn tại' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.Password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Sai mật khẩu' });
        }

        // Only put non-sensitive info in token payload (no password)
        const tokenPayload = {
            id: user._id,
            email: user.Email,
            role: user.Role
        };

        let token;
        if (isKeepLogin) {
            token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        } else {
            token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict'
            });
        }

        // Log the decoded token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        return res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user._id,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Check token và trả về user info nếu hợp lệ
// Đã có middleware verifyToken đảm bảo token hợp lệ và req.user có thông tin giải mã từ token
export const checklogin = async (req, res) => {
    try {
        // Lấy user id từ req.user (đã verify)
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không xác định được user từ token.' });
        }

        // Query lại user phòng trường hợp role hoặc thông tin bị thay đổi sau khi cấp token
        const user = await accountModel.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Người dùng không tồn tại.' });
        }
        return res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user._id,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (error) {
        console.error('Lỗi khi kiểm tra đăng nhập:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};


// Đăng xuất: Xóa token ở cookie
export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
    });
    res.json({ success: true, message: 'Đăng xuất thành công' });
};
