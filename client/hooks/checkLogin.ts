"use client";
import { apiCheckLogin } from "@/api/auth.api";
import { loginSuccess } from "@/store/slices/authSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";

export function useCheckLogin() {
    const dispatch = useDispatch();
    const authState = useSelector((state: any) => state.auth);
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        
        if (pathname?.startsWith("/auth")) {
            setIsChecking(false);
            return;
        }

        // Nếu đã đăng nhập thì cho render luôn
        if (authState.isAuthenticated) {
            setIsChecking(false);
            return;
        }

        const checklogin = async () => {
            try {
                const data = await apiCheckLogin();
                if (data && data.user) {
                    dispatch(
                        loginSuccess({
                            user: data.user,
                        })
                    );
                } else {
                    router.replace("/auth");
                }
            } catch (error) {
                router.replace("/auth");
            }
        };

        checklogin();
    }, [authState.isAuthenticated, dispatch, pathname, router]);

    return isChecking;
}