import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../lib/api";

const initialState = {
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
    loading: false,
};

// ✅ Load user from token
export const loadUser = createAsyncThunk("auth/loadUser", async (_, thunkAPI) => {
    try {
        const res = await api.get("/auth/me");
        return res.data; // {id, name, email, role, ...}
    } catch (err) {
        return thunkAPI.rejectWithValue("Failed to load user");
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            localStorage.setItem("token", token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem("token");
        },
        updateProfile: (state, action) => {
            state.user = { ...state.user, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(loadUser.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            });
    },
});

export const { loginSuccess, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
