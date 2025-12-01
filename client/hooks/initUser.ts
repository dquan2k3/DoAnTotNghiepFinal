"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addBio, addProfile } from "@/store/slices/userSlice";
import instance from "@/axiosConfig";

export function useInitUser() {
    const dispatch = useDispatch();
    useEffect(() => {
        const fetchBioAndName = async () => {
            try {
                const bioRes = await instance.post("/bio/getBio");
                console.log('getBio response:', bioRes.data);

                const nameRes = await instance.post("/profile/getName");
                console.log('getName response:', nameRes.data);

                // Dispatch dữ liệu response vào store
                if (bioRes?.data) {
                    dispatch(addBio(bioRes.data.bio));
                }
                if (nameRes?.data) {
                    dispatch(addProfile(nameRes.data));
                }
            } catch (error) {
                console.error('Error calling getBio or getName:', error);
            }
        };

        fetchBioAndName();
    }, []);
}