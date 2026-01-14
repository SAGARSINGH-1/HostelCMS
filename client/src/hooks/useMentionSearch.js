// hooks/useMentionSearch.js
import { useState, useRef } from "react";
import api from "../lib/api";

export default function useMentionSearch() {
    const [items, setItems] = useState([]);
    const timer = useRef();

    const search = (q) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            if (!q || q.length < 2) return setItems([]);
            const res = await api.get(`/usernames/search?q=${encodeURIComponent(q)}`);
            setItems(res.data || []);
        }, 200);
    };

    return { items, search, clear: () => setItems([]) };
}
