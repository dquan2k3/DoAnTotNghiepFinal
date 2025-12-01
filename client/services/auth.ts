import { AppDispatch } from "@/store";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import { addBio, removeBio, addProfile, removeProfile } from "@/store/slices/userSlice";
import { apiLogin, apiLogout, apiRegister, LoginPayload, RegisterPayload } from "@/api/auth.api";
import { toast } from "react-toastify";

// Đăng xuất xong chuyển hướng đến trang auth
// Để nav được, nhận thêm đối số router truyền từ useRouter của next/router hoặc react-router

// Login — có Redux, token, toast
export const authLogin = async (dispatch: AppDispatch, payload: LoginPayload) => {
  try {
    const data = await apiLogin(payload);

    dispatch(
      loginSuccess({
        user: data.user,
      })
    );

    toast.success("Đăng nhập thành công!");
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Đăng nhập thất bại!";
    toast.error(msg);
    throw error;
  }
};

// Register — không dùng Redux
export const authRegister = async (payload: RegisterPayload) => {
  try {
    const data = await apiRegister(payload);
    toast.success("Đăng ký thành công!");
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Đăng ký thất bại!";
    toast.error(msg);
    throw error;
  }
};

// Logout: Gọi API logout xong mới clear all store và storage, sau đó chuyển hướng đến /auth
export const authLogout = async (
  dispatch: AppDispatch,
  router: { push: (path: string) => void }
) => {
  try {
    const res = await apiLogout();
    console.log(res);
  } catch (error: any) {
    // thông báo hoặc xử lý lỗi logout
  }

  localStorage.clear();
  sessionStorage.clear?.();
  dispatch(logout());
  dispatch(removeBio());
  dispatch(removeProfile());
  toast.info("Đã đăng xuất!");
  router.push("/auth"); // <-- điều hướng đến trang đăng nhập
};
