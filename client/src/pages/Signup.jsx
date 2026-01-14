import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "sonner";

const usernameRegex = /^[a-z0-9_.]{3,30}$/;

const schema = z.object({
    role: z.enum(["student", "faculty"]),
    name: z
        .string({ required_error: "Name is required" })
        .min(2, "Name must be at least 2 characters"),
    username: z
        .string({ required_error: "Username is required" })
        .trim()
        .toLowerCase()
        .regex(usernameRegex, "3-30 chars, lowercase letters, numbers, _ or ."),
    email: z
        .string({ required_error: "Email is required" })
        .email("Enter a valid email"),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
    hostel: z.string().optional(),
    roomNo: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
});

export default function Signup() {
    const [role, setRole] = useState("student");
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { role: "student" },
    });

    const onSubmit = async (data) => {
        try {
            // Optional nudges
            if (data.role === "student") {
                if (!data.hostel || !data.roomNo) {
                    toast.message("Optional details missing", {
                        description: "Hostel and room help faculty resolve faster.",
                    });
                }
            }
            if (data.role === "faculty") {
                if (!data.department || !data.designation) {
                    toast.message("Optional details missing", {
                        description: "Department and designation help with permissions.",
                    });
                }
            }

            const url =
                data.role === "student" ? "/auth/student/signup" : "/auth/faculty/signup";

            const payload = {
                ...data,
                username: data.username.trim().toLowerCase(),
            };

            const res = await api.post(url, payload);

            const token = res?.data?.token;
            if (token) {
                localStorage.setItem("token", token);
            }

            toast.success("Signup successful", {
                description: "Please log in to continue.",
            });
            navigate("/login");
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Signup failed";
            toast.error("Signup failed", { description: msg });
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Sign Up</CardTitle>
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
                            <Label>Name</Label>
                            <Input {...register("name")} />
                            {errors.name && (
                                <p className="text-red-500 text-sm">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <Label>Username</Label>
                            <Input placeholder="e.g. ravi_sharma" {...register("username")} />
                            {errors.username && (
                                <p className="text-red-500 text-sm">{errors.username.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                3–30 lowercase letters, numbers, _ or .
                            </p>
                        </div>

                        <div>
                            <Label>Email</Label>
                            <Input type="email" {...register("email")} />
                            {errors.email && (
                                <p className="text-red-500 text-sm">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <Label>Password</Label>
                            <Input type="password" {...register("password")} />
                            {errors.password && (
                                <p className="text-red-500 text-sm">{errors.password.message}</p>
                            )}
                        </div>

                        {role === "student" && (
                            <>
                                <div>
                                    <Label>Hostel</Label>
                                    <Input {...register("hostel")} />
                                </div>
                                <div>
                                    <Label>Room No</Label>
                                    <Input {...register("roomNo")} />
                                </div>
                            </>
                        )}

                        {role === "faculty" && (
                            <>
                                <div>
                                    <Label>Department</Label>
                                    <Input {...register("department")} />
                                </div>
                                <div>
                                    <Label>Designation</Label>
                                    <Input {...register("designation")} />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input {...register("phone")} />
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Signing up..." : "Sign Up"}
                        </Button>
                    </form>

                    <p className="text-center text-sm mt-4">
                        Already have an account?{" "}
                        <button
                            onClick={() => navigate("/login")}
                            className="text-blue-600 hover:underline cursor-pointer"
                        >
                            Login here
                        </button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
