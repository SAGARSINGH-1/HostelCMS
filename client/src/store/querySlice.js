// querySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../lib/api";

// 🔹 fetch stats
export const fetchQueryStats = createAsyncThunk(
    "queries/fetchStats",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/query/queries/stats");
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Error fetching stats");
        }
    }
);

const querySlice = createSlice({
    name: "queries",
    initialState: {
        stats: { total: 0, resolved: 0, pending: 0, byTags: {} }, // ⬅️ added byTags
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchQueryStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchQueryStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload; // includes total/resolved/pending/byTags
            })
            .addCase(fetchQueryStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default querySlice.reducer;
