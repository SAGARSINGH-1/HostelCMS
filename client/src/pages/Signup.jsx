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
import CustomSelect from "../components/ui/CustomSelect";
import { toast } from "sonner";

const usernameRegex = /^[a-z0-9_.]{3,30}$/;

const schema = z.object({
    role: z.enum(["student", "faculty"]),
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().trim().toLowerCase().regex(usernameRegex),
    email: z.string().email(),
    password: z.string().min(6),

    hostel: z.string().optional(),
    roomNo: z.string().optional(),

    department: z.string().optional(),

    // ✅ NEW: categories array
    categories: z.array(z.string()).optional(),

    phone: z.string().optional(),
});

export default function Signup() {
    const [role, setRole] = useState("student");
    const [categories, setCategories] = useState([]);

    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { role: "student", categories: [] },
    });

    const onSubmit = async (data) => {
        try {
            if (data.role === "faculty") {
                if (!data.department || categories.length === 0) {
                    toast.message("Optional details missing", {
                        description: "Department and categories help auto-assign complaints.",
                    });
                }
            }

            const url =
                data.role === "student"
                    ? "/auth/student/signup"
                    : "/auth/faculty/signup";

            const payload = {
                ...data,
                username: data.username.trim().toLowerCase(),
                categories, // ✅ send array
            };

            const res = await api.post(url, payload);

            const token = res?.data?.token;
            if (token) localStorage.setItem("token", token);

            toast.success("Signup successful");
            navigate("/login");
        } catch (err) {
            const msg = err?.response?.data?.message || "Signup failed";
            toast.error(msg);
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
                            <CustomSelect
                                value={role}
                                onChange={(value) => {
                                    setRole(value);
                                    setValue("role", value);
                                }}
                                options={[
                                    { label: "Student", value: "student" },
                                    { label: "Faculty", value: "faculty" },
                                ]}
                            />
                        </div>

                        <div>
                            <Label>Name</Label>
                            <Input {...register("name")} />
                        </div>

                        <div>
                            <Label>Username</Label>
                            <Input {...register("username")} />
                        </div>

                        <div>
                            <Label>Email</Label>
                            <Input type="email" {...register("email")} />
                        </div>

                        <div>
                            <Label>Password</Label>
                            <Input type="password" {...register("password")} />
                        </div>

                        {/* STUDENT */}
                        {role === "student" && (
                            <>
                                <Input placeholder="Hostel" {...register("hostel")} />
                                <Input placeholder="Room No" {...register("roomNo")} />
                            </>
                        )}

                        {/* FACULTY */}
                        {role === "faculty" && (
                            <>
                                <Input placeholder="Department" {...register("department")} />

                                {/* ✅ Categories Input (simple version) */}
                                <div>
                                    <Label>Categories (comma separated)</Label>
                                    <Input
                                        placeholder="e.g. internet, water, mess"
                                        onChange={(e) => {
                                            const value = e.target.value
                                                .split(",")
                                                .map((v) => v.trim())
                                                .filter(Boolean);

                                            setCategories(value);
                                            setValue("categories", value);
                                        }}
                                    />
                                </div>

                                <Input placeholder="Phone" {...register("phone")} />
                            </>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Signing up..." : "Sign Up"}
                        </Button>
                        <p className="text-center text-sm mt-4">
                            Already have an account?{" "}
                            <button
                                onClick={() => navigate("/login")}
                                className="text-blue-600 hover:underline cursor-pointer"
                            >
                                login here
                            </button>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}