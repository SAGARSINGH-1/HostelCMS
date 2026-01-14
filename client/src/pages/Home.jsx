// src/pages/Home.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, CheckCircle2, Plus, User } from "lucide-react";
import { fetchQueryStats } from "../store/querySlice";

export default function Home() {
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { stats, loading, error } = useSelector((state) => state.query);

    useEffect(() => {
        dispatch(fetchQueryStats());
    }, [dispatch]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
            {/* Hero Section */}
            <section className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    Hostel Complaint Management System
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                    A centralized platform for students to raise issues and for faculty/admins to manage them efficiently.
                </p>
                {!isAuthenticated && (
                    <div className="flex justify-center gap-4 mt-4">
                        <Link to="/login">
                            <Button>Login</Button>
                        </Link>
                        <Link to="/signup">
                            <Button variant="outline">Signup</Button>
                        </Link>
                    </div>
                )}
            </section>

            {/* Role Banner */}
            <section className="text-center">
                <span className="px-3 py-1 text-sm rounded-full bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-gray-100">
                    {isAuthenticated
                        ? user?.designation
                            ? "Faculty"
                            : "Student"
                        : "Guest"}
                </span>
            </section>

            {/* Quick Actions (Role-based) */}
            {isAuthenticated && (
                <section className="grid md:grid-cols-3 gap-6">
                    {user?.designation ? (
                        // ✅ Faculty actions
                        <>
                            {/* Manage Complaints */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                        Manage Complaints
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        View, filter, and resolve student complaints.
                                    </p>
                                    <Link to="/faculty/dashboard">
                                        <Button className="mt-3 w-full">Go to Dashboard</Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Complaint Statistics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        Complaint Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Get insights on resolved vs pending complaints.
                                    </p>
                                    <Link to="/faculty/stats">
                                        <Button className="mt-3 w-full" variant="outline">
                                            View Stats
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Faculty Profile */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-500" />
                                        My Faculty Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Manage your department info and update designation.
                                    </p>
                                    <Link to="/profile">
                                        <Button className="mt-3 w-full" variant="secondary">
                                            Profile
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        // ✅ Student actions
                        <>
                            {/* Create Complaint */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-green-600" />
                                        Create Complaint
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Raise a new complaint about hostel facilities or issues.
                                    </p>
                                    <Link to="/queries">
                                        <Button className="mt-3 w-full">New Complaint</Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Complaints */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                        Complaints
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Track the status of complaints you’ve submitted.
                                    </p>
                                    <Link to="/queries">
                                        <Button className="mt-3 w-full" variant="outline">
                                            View Complaints
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Profile */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-500" />
                                        My Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Update your personal details and view hostel information.
                                    </p>
                                    <Link to="/profile">
                                        <Button className="mt-3 w-full" variant="secondary">
                                            Profile
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </section>
            )}

            {/* Stats Section */}
            <section className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Complaints</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {loading ? "..." : stats.total}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Resolved</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-green-600">
                        {loading ? "..." : stats.resolved}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-yellow-500">
                        {loading ? "..." : stats.pending}
                    </CardContent>
                </Card>
            </section>

            {/* Footer */}
            <footer className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                © {new Date().getFullYear()} Hostel CMS. Built for better hostel living.
            </footer>
        </div>
    );
}
