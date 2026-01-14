import { createContext, useState, useEffect, use } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);

    useEffect(() => {
        if (token && !user) {
            // Optionally fetch profile here
        }
    }, [token]);

    const login = async (email, password, type = "student") => {
        const res = await axios.post(`/api/auth/${type}/login`, { email, password });
        setUser(res.data.student || res.data.faculty);
        setToken(res.data.token);
        useDispatch(loginSuccess({ user: res.data.student || res.data.faculty, token: res.data.token }));
        localStorage.setItem("token", res.data.token);

    };

    const signup = async (data, type = "student") => {
        await axios.post(`/api/auth/${type}/signup`, data);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
