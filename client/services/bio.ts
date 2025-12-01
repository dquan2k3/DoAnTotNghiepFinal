
import { apiUpdateProfile } from "@/api/bio.api";
import instance from "@/axiosConfig";
import { addBio } from "@/store/slices/userSlice"; // Import addBio action from userSlice
import { Dispatch } from "redux";

export interface CropArea {
    width: number;
    height: number;
    x: number;
    y: number;
}

export interface CropStat {
    x: number;
    y: number;
    zoom: number;
}

export interface AvatarCoverObject {
    original?: File | null;    // Original file (optional, if needed)
    cropArea?: CropArea | null;
    cropStat?: CropStat | null;
    cfNewAvatar?: boolean;
    cfNewCover?: boolean;
}

export interface UpdateProfilePayload {
    avatar?: AvatarCoverObject | null;
    cover?: AvatarCoverObject | null;
    bio: string;
    avatarChanged: boolean;
    coverChanged: boolean;
    descriptionChanged: boolean;
    cfNewAvatar?: boolean;
    cfNewCover?: boolean;
}

// Accept dispatch as an argument in this version for flexibility
export async function updateProfile(data: UpdateProfilePayload, dispatch?: Dispatch) {
    const formData = new FormData();

    // avatar
    if (data.avatarChanged) {
        formData.append('avatarChanged', 'true');
        if (data.avatar) {
            formData.append('cfNewAvatar', data.cfNewAvatar ? 'true' : 'false');
            if (data.cfNewAvatar) {
                if (typeof File !== 'undefined' && data.avatar.original instanceof File) {
                    formData.append('avatar', data.avatar.original);
                }
            }
            if (data.avatar.cropStat) {
                if (typeof data.avatar.cropStat.zoom !== 'undefined')
                    formData.append('avatarZoom', String(data.avatar.cropStat.zoom));
                if (typeof data.avatar.cropStat.x !== 'undefined')
                    formData.append('avatarCropX', String(data.avatar.cropStat.x));
                if (typeof data.avatar.cropStat.y !== 'undefined')
                    formData.append('avatarCropY', String(data.avatar.cropStat.y));
            }
            if (data.avatar.cropArea) {
                if (typeof data.avatar.cropArea.x !== 'undefined')
                    formData.append('avatarCroppedAreaX', String(data.avatar.cropArea.x));
                if (typeof data.avatar.cropArea.y !== 'undefined')
                    formData.append('avatarCroppedAreaY', String(data.avatar.cropArea.y));
                if (typeof data.avatar.cropArea.width !== 'undefined')
                    formData.append('avatarCroppedAreaWidth', String(data.avatar.cropArea.width));
                if (typeof data.avatar.cropArea.height !== 'undefined')
                    formData.append('avatarCroppedAreaHeight', String(data.avatar.cropArea.height));
            }
        } else {
            formData.append('cfNewAvatar', 'false');
        }
    } else {
        formData.append('avatarChanged', 'false');
        formData.append('cfNewAvatar', 'false');
    }

    // cover
    if (data.coverChanged) {
        formData.append('coverChanged', 'true');
        if (data.cover) {
            formData.append('cfNewCover', data.cfNewCover ? 'true' : 'false');
            if (data.cfNewCover) {
                if (typeof File !== 'undefined' && data.cover.original instanceof File) {
                    formData.append('cover', data.cover.original);
                }
            }
            if (data.cover.cropStat) {
                if (typeof data.cover.cropStat.zoom !== 'undefined')
                    formData.append('coverZoom', String(data.cover.cropStat.zoom));
                if (typeof data.cover.cropStat.x !== 'undefined')
                    formData.append('coverCropX', String(data.cover.cropStat.x));
                if (typeof data.cover.cropStat.y !== 'undefined')
                    formData.append('coverCropY', String(data.cover.cropStat.y));
            }
            if (data.cover.cropArea) {
                if (typeof data.cover.cropArea.x !== 'undefined')
                    formData.append('coverCroppedAreaX', String(data.cover.cropArea.x));
                if (typeof data.cover.cropArea.y !== 'undefined')
                    formData.append('coverCroppedAreaY', String(data.cover.cropArea.y));
                if (typeof data.cover.cropArea.width !== 'undefined')
                    formData.append('coverCroppedAreaWidth', String(data.cover.cropArea.width));
                if (typeof data.cover.cropArea.height !== 'undefined')
                    formData.append('coverCroppedAreaHeight', String(data.cover.cropArea.height));
            }
        } else {
            formData.append('cfNewCover', 'false');
        }
    } else {
        formData.append('coverChanged', 'false');
        formData.append('cfNewCover', 'false');
    }

    // description
    if ('descriptionChanged' in data) {
        formData.append('descriptionChanged', String(!!data.descriptionChanged));
        if (data.descriptionChanged) {
            formData.append('description', data.bio || '');
        }
    }

    // debug: log formData
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            console.log(`formData: ${key}=`, value, 'name:', value.name, 'size:', value.size, 'type:', value.type);
        } else {
            console.log(`formData: ${key}=`, value);
        }
    }

    const response = await apiUpdateProfile(formData);

    console.log("RESPONSE LOG FROM API CALL FUNCTION : ", response);

    // Dispatch addBio if dispatch is provided and response has .data.bio
    if (dispatch && response?.data) {
        dispatch(addBio(response.data.bio));
    }

    return response;
}
