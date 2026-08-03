// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import useEmblaCarousel from 'embla-carousel-react';
import {
    AlertCircle, CheckCircle2, Clock3, Plus,
    LogIn, BarChart3, UserPlus
} from "lucide-react";

import api from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { fetchQueryStats } from "../store/querySlice";

// 1. Stat Card Component
function StatCard({ title, value, icon: Icon, valueClassName = "" }) {
    return (
        <Card className="rounded-2xl">
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// 2. Action Card Component
function ActionCard({ title, description, icon: Icon, to, buttonText, buttonVariant = "default" }) {
    return (
        <Card className="h-full rounded-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex h-[calc(100%-72px)] flex-col justify-between">
                <p className="text-sm text-muted-foreground">{description}</p>
                <Link to={to} className="mt-4">
                    <Button className="w-full" variant={buttonVariant}>
                        {buttonText}
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

// 3. Carousel Component (Fetches latest complaints)
function ComplaintCarousel() {
    const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' });
    const [queries, setQueries] = useState([]);

    useEffect(() => {
        api.get('/query/queries?limit=4')
            .then(res => setQueries(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Carousel fetch error:", err));
    }, []);

    if (queries.length === 0) return null;

    return (
        <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
                {queries.map((q) => (
                    <div key={q._id} className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%]">
                        <Card className="h-full rounded-2xl border-primary/10">
                            <CardHeader><CardTitle className="text-lg truncate">{q.title}</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 h-10">{q.description}</p>
                                <Link to={`/query/${q._id}`}>
                                    <Button variant="ghost" className="mt-4 dark:text-white text-black w-full justify-start pl-0">View Details →</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 4. Main Home Page
export default function Home() {
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { stats, loading, error } = useSelector((state) => state.query);

    useEffect(() => {
        dispatch(fetchQueryStats());
    }, [dispatch]);

    const isFaculty = user?.role === "faculty" || Boolean(user?.designation);
    const roleLabel = !isAuthenticated ? "Guest" : isFaculty ? "Faculty" : "Student";
    const total = stats?.total ?? 0;
    const resolved = stats?.resolved ?? 0;
    const pending = stats?.pending ?? 0;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 space-t-12">
            {/* Hero Section */}
            <section className="rounded-3xl border bg-gradient-to-br from-background to-muted/40 p-8 md:p-10">
                <div className="max-w-3xl space-y-4">
                    <span className="inline-flex rounded-full border px-3 py-1 text-sm text-muted-foreground">
                        {roleLabel}
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                        CUH Complaint Management System
                    </h1>
                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                        A centralized platform for resolving campus and hostel issues.
                        Students can create and track complaints, while faculty can view statistics and status insights.
                    </p>
                    {!isAuthenticated && (
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <Link to="/login"><Button className="w-full sm:w-auto"><LogIn className="mr-2 h-4 w-4" /> Login</Button></Link>
                            <Link to="/signup"><Button variant="outline" className="w-full sm:w-auto"><UserPlus className="mr-2 h-4 w-4" /> Signup</Button></Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Student/Faculty Action Section */}
            <section className="space-y-4 p-8">
                <h2 className="text-xl font-semibold">
                    {isFaculty ? "Faculty Actions" : "Student Actions"}
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                    {isFaculty ? (
                        <>
                            <ActionCard title="Complaint Statistics" description="View complaint insights and system performance." icon={BarChart3} to="/faculty/stats" buttonText="View Stats" />
                            <ActionCard title="My Complaints" description="Track issues you are overseeing." icon={AlertCircle} to="/queries" buttonText="View Complaints" buttonVariant="outline" />
                        </>
                    ) : (
                        <>
                            <ActionCard title="Create Complaint" description="Raise a new issue related to campus or hostel facilities." icon={Plus} to="/queries" buttonText="New Complaint" />
                            <ActionCard title="My Complaints" description="Track status of your submitted complaints." icon={AlertCircle} to="/queries" buttonText="View Complaints" buttonVariant="outline" />
                        </>
                    )}
                </div>
            </section>

            {/* Carousel Section */}
            <section className="space-y-6 p-8">
                <div>
                    <h2 className="text-2xl font-bold">Recent Complaints</h2>
                    <p className="text-muted-foreground">Stay updated with the latest issues on campus.</p>
                </div>
                <ComplaintCarousel />
            </section>

            {/* Overview Stats */}
            <section className="space-y-2 p-8">
                <h2 className="text-xl font-semibold">Complaint Overview</h2>
                {error ? (
                    <Card className="rounded-2xl border-destructive/30"><CardContent className="p-6"><p className="text-sm text-destructive">Failed to load statistics.</p></CardContent></Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard title="Total Complaints" value={loading ? "..." : total} icon={AlertCircle} />
                        <StatCard title="Resolved" value={loading ? "..." : resolved} icon={CheckCircle2} valueClassName="text-green-600" />
                        <StatCard title="Pending" value={loading ? "..." : pending} icon={Clock3} valueClassName="text-amber-500" />
                    </div>
                )}
            </section>

            <footer className="pt-2 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} CUH CMS. Built for better university living.
            </footer>
        </div>
    );
}