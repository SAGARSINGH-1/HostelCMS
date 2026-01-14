import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "../components/ui/select";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/authSlice";
import { toast } from "sonner";

const isEmail = (v = "") => v.includes("@");

export default function Login() {
    const dispatch = useDispatch();
    const [role, setRole] = useState("student");
    const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            if (!data.identifier || !data.password) {
                toast.message("Missing fields", { description: "Identifier and password are required." });
                return;
            }

            const url = (data.role || role) === "student" ? "/auth/student/login" : "/auth/faculty/login";

            // Normalize identifier: lowercase if it's a username (not an email)
            const identifier = isEmail(data.identifier) ? data.identifier : data.identifier.trim().toLowerCase();

            const res = await api.post(url, { identifier, password: data.password });

            const { token, student, faculty } = res.data || {};
            if (!token) {
                toast.error("Login failed", { description: "No token returned by server." });
                return;
            }

            localStorage.setItem("token", token);
            dispatch(loginSuccess({ user: student || faculty, token }));

            const displayName = (student?.name || faculty?.name || "Logged in");
            toast.success("Login successful", { description: displayName });

            navigate("/");
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            const msg = serverMsg || err.message || "Login failed";
            toast.error("Login failed", { description: msg });
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Role */}
                        <div>
                            <Label>Role</Label>
                            <Select
                                defaultValue={role}
                                onValueChange={(value) => {
                                    setRole(value);
                                    setValue("role", value);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="faculty">Faculty</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Identifier</Label>
                            <Input
                                type="text"
                                placeholder="Email or username"
                                {...register("identifier")}
                            />
                        </div>

                        <div>
                            <Label>Password</Label>
                            <Input type="password" placeholder="••••••••" {...register("password")} />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Signing in..." : "Login"}
                        </Button>
                    </form>

                    <p className="text-center text-sm mt-4">
                        Don&apos;t have an account?{" "}
                        <button
                            onClick={() => navigate("/signup")}
                            className="text-blue-600 hover:underline cursor-pointer"
                        >
                            Sign up here
                        </button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
