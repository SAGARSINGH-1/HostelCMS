import { useState, useEffect } from "react";
import api from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { useSelector } from "react-redux";

// Sidebar Component
function Sidebar({ activeTab, setActiveTab, darkMode, setDarkMode, handleDelete }) {
    return (
        <div className="w-64 h-screen bg-white dark:bg-gray-800 shadow-md flex flex-col justify-between">
            <div>
                <h2 className="text-xl font-bold p-4 text-gray-700 dark:text-gray-100">
                    Settings
                </h2>
                <nav className="flex flex-col space-y-2 px-4">
                    <Button
                        variant={activeTab === "profile" ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => setActiveTab("profile")}
                    >
                        Profile
                    </Button>
                    <Button
                        variant={activeTab === "preferences" ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => setActiveTab("preferences")}
                    >
                        Preferences
                    </Button>
                    <Button
                        variant={activeTab === "security" ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => setActiveTab("security")}
                    >
                        Security
                    </Button>
                </nav>
            </div>
            <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-gray-700 dark:text-gray-200">Dark Mode</Label>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <Button variant="destructive" className="w-full" onClick={handleDelete}>
                    Delete Account
                </Button>
            </div>
        </div>
    );
}

export default function Settings() {
    const { darkMode, setDarkMode } = useTheme();
    const reduxUser = useSelector((state) => state.auth.user);
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const token = localStorage.getItem("token");

    // Decode role/id from token
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            return null;
        }
    };
    const payload = parseJwt(token);

    useEffect(() => {
        setUser(reduxUser);
    }, [reduxUser]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            const res = await api.put(
                `/auth/${user.role}/update/${user.id}`,
                form,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Profile updated!");
            setForm(res.data);
            setEditMode(false);
        } catch {
            alert("Update failed");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete your account?")) return;
        try {
            await api.delete(`/auth/${user.role}/delete/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            localStorage.removeItem("token");
            alert("Account deleted");
            window.location.href = "/signup";
        } catch {
            alert("Delete failed");
        }
    };

    // Content for each tab
    const renderContent = () => {
        if (activeTab === "profile") {
            return (
                <div className="w-full ">
                    <CardContent>
                        {editMode ? (
                            <div className="space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.name || ""}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email || ""}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                    />
                                </div>

                                {/* Student fields */}
                                {user?.role === "student" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="hostel">Hostel</Label>
                                            <Input
                                                id="hostel"
                                                name="hostel"
                                                value={form.hostel || ""}
                                                onChange={handleChange}
                                                placeholder="Enter hostel"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="roomNo">Room Number</Label>
                                            <Input
                                                id="roomNo"
                                                name="roomNo"
                                                value={form.roomNo || ""}
                                                onChange={handleChange}
                                                placeholder="Enter room number"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Faculty fields */}
                                {user?.role === "faculty" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                            <Input
                                                id="department"
                                                name="department"
                                                value={form.department || ""}
                                                onChange={handleChange}
                                                placeholder="Enter department"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="designation">Designation</Label>
                                            <Input
                                                id="designation"
                                                name="designation"
                                                value={form.designation || ""}
                                                onChange={handleChange}
                                                placeholder="Enter designation"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={form.phone || ""}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button onClick={handleUpdate}>Save</Button>
                                    <Button variant="outline" onClick={() => setEditMode(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-muted">
                                {/* Name */}
                                <div className="flex justify-between py-3">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Name</span>
                                    <span className="text-gray-900 dark:text-gray-100">{form.name}</span>
                                </div>

                                {/* Email */}
                                <div className="flex justify-between py-3">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Email</span>
                                    <span className="text-gray-900 dark:text-gray-100">{form.email}</span>
                                </div>

                                {/* Student fields */}
                                {user?.role === "student" && (
                                    <>
                                        <div className="flex justify-between py-3">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Hostel</span>
                                            <span className="text-gray-900 dark:text-gray-100">{form.hostel}</span>
                                        </div>
                                        <div className="flex justify-between py-3">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Room No</span>
                                            <span className="text-gray-900 dark:text-gray-100">{form.roomNo}</span>
                                        </div>
                                    </>
                                )}

                                {/* Faculty fields */}
                                {user?.role === "faculty" && (
                                    <>
                                        <div className="flex justify-between py-3">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Department</span>
                                            <span className="text-gray-900 dark:text-gray-100">{form.department}</span>
                                        </div>
                                        <div className="flex justify-between py-3">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Designation</span>
                                            <span className="text-gray-900 dark:text-gray-100">{form.designation}</span>
                                        </div>
                                        <div className="flex justify-between py-3">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Phone</span>
                                            <span className="text-gray-900 dark:text-gray-100">{form.phone}</span>
                                        </div>
                                    </>
                                )}

                                {/* Edit Button */}
                                <div className="flex justify-end pt-4">
                                    <Button onClick={() => setEditMode(true)}>Edit</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </div>
            );
        }

        if (activeTab === "preferences") {
            return (
                <div className="w-full">
                    <div>
                        <div>Preferences</div>
                    </div>
                    <div>
                        <p className="text-gray-700 dark:text-gray-300">Dark mode and language options can be managed here.</p>
                    </div>
                </div>
            );
        }

        if (activeTab === "security") {
            return (
                <div className="w-full">
                    <div>
                        <div>Security</div>
                    </div>
                    <div>
                        <p className="text-gray-700 dark:text-gray-300">Password reset and 2FA settings will go here.</p>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                handleDelete={handleDelete}
            />
            <div className="flex-1 flex justify-center items-start p-8">
                {renderContent()}
            </div>
        </div>
    );
}
