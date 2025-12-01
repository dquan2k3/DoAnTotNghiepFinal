import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CroppedStat {
  zoom?: number;
  cropX?: number;
  cropY?: number;
}

interface CroppedArea {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Bio {
  avatar?: string;
  avatarCroppedStat?: CroppedStat;
  avatarCroppedArea?: CroppedArea;
  cover?: string;
  coverCroppedStat?: CroppedStat;
  coverCroppedArea?: CroppedArea;
  description?: string;
}

export interface Profile {
  name?: string;
  username?: string;
  nameChangedDate?: string | null;
  usernameChangedDate?: string | null;
}

interface UserBioState {
  bio: Bio | null;
  profile: Profile | null;
}

const initialState: UserBioState = {
  bio: null,
  profile: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addBio: (state, action: PayloadAction<Bio>) => {
      state.bio = action.payload;
    },
    removeBio: (state) => {
      state.bio = null;
    },
    addProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
    removeProfile: (state) => {
      state.profile = null;
    },
  }
});

export const { addBio, removeBio, addProfile, removeProfile } = userSlice.actions;
export default userSlice.reducer;
