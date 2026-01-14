import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu, Search, Plus, LogOut, User, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { id } from "date-fns/locale/id";

const navItems = [
    { label: "Dashboard", to: "/", id: 1 },
    { label: "My Queries", to: "/queries", id: 2 },
    { label: "Profile", to: "/profile", id: 3 },
    { label: "About", to: "/about", id: 4 },
    { label: "Creator", to: "/creator", id: 5 },
];
function ThemeToggle() {
    const { darkMode, setDarkMode } = useTheme();

    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-gray-700"
        >
            {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
                <Moon className="h-5 w-5 text-gray-800" />
            )}
        </button>
    );
}

export default function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        toast.success("Logged out");
        navigate("/login")
        localStorage.removeItem("token");
    };

    return (
        <header className="w-full bg-white border-b shadow-sm dark:bg-gray-900 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-[#2C3E50] flex items-center justify-center text-white font-bold">
                                H
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    Hostel CMS
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Complaint Management
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Center: Nav (desktop) */}
                    <nav className="hidden md:flex items-center gap-6">
                        {isAuthenticated &&
                            navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    id={item.id}
                                    className={({ isActive }) =>
                                        `text-sm font-medium ${isActive
                                            ? "text-[#18BC9C]"
                                            : "text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                                        }`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Role badge */}
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-md bg-slate-200 text-slate-800 dark:bg-gray-700 dark:text-gray-100">
                                {user
                                    ? (user.designation ? "Faculty" : "Student")
                                    : "Guest"}
                            </span>
                        </div>

                        {/* ✅ Show Login/Signup only if not authenticated */}
                        {!isAuthenticated && (
                            <div className="hidden md:block">
                                <Link to="/login">
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" /> Login / Signup
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Theme toggle */}
                        <ThemeToggle />

                        {/* Avatar + Dropdown only if logged in */}
                        {isAuthenticated && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2">
                                        <Avatar>
                                            {user?.avatarUrl ? (
                                                <AvatarImage
                                                    src={user.avatarUrl}
                                                    alt={user?.name}
                                                />
                                            ) : (
                                                <AvatarFallback>
                                                    {user?.name?.[0] ?? "U"}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    side="bottom"
                                    className="w-48 dark:bg-gray-800"
                                >
                                    <div className="px-3 py-2 border-b dark:border-gray-700">
                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                            {user?.name}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {user?.email}
                                        </div>
                                    </div>
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="flex items-center gap-2">
                                            <User className="h-4 w-4" /> Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings" className="flex items-center gap-2">
                                            <Search className="h-4 w-4" /> Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            handleLogout();
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <LogOut className="h-4 w-4" /> Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Mobile menu stays, but can also conditionally render items */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800">
                                        <Menu className="h-5 w-5" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className="w-64 dark:bg-gray-900 dark:text-gray-100"
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-lg font-semibold">Hostel CMS</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    Menu
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            {isAuthenticated &&
                                                navItems.map((item) => (
                                                    <NavLink
                                                        key={item.to}
                                                        to={item.to}
                                                        className={({ isActive }) =>
                                                            `px-3 py-2 rounded-md ${isActive
                                                                ? "bg-slate-100 text-[#18BC9C] dark:bg-gray-800"
                                                                : "hover:bg-slate-50 dark:hover:bg-gray-700"
                                                            }`
                                                        }
                                                    >
                                                        {item.label}
                                                    </NavLink>
                                                ))}
                                        </div>

                                        <div className="mt-auto">
                                            {isAuthenticated ? (
                                                <Button
                                                    onClick={handleLogout}
                                                    className="w-full"
                                                >
                                                    Logout
                                                </Button>
                                            ) : (
                                                <Link to="/login">
                                                    <Button className="w-full">Login / Signup</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
