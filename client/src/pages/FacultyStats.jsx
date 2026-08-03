// src/pages/FacultyStats.jsx
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchQueryStats } from "../store/querySlice";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";

// Semantic colors: Resolved=Green, Pending=Amber, In-Progress=Blue
const STATUS_COLORS = {
    resolved: "#22c55e",
    pending: "#eab308",
    "in-progress": "#3b82f6",
    unknown: "#94a3b8"
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-3 shadow-sm">
                <p className="mb-2 font-semibold">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.fill }}>
                        {entry.name}: <span className="font-bold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function FacultyStats() {
    const dispatch = useDispatch();
    const { stats, loading, error } = useSelector((state) => state.query);

    useEffect(() => {
        dispatch(fetchQueryStats());
    }, [dispatch]);

    // Data Processing
    const { tagsData, pieData, totals } = useMemo(() => {
        if (!stats) return { tagsData: [], pieData: [], totals: {} };

        const raw = Array.isArray(stats.byTags) ? stats.byTags : [];
        const map = raw.reduce((acc, doc) => {
            const tag = doc?._id?.tag ?? "Other";
            const status = doc?._id?.status ?? "unknown";
            const count = Number(doc?.count ?? 0);

            if (!acc[tag]) acc[tag] = { tag, resolved: 0, pending: 0, "in-progress": 0 };
            acc[tag][status] = (acc[tag][status] || 0) + count;
            return acc;
        }, {});

        const tagsData = Object.values(map);
        const resolved = stats.resolved ?? tagsData.reduce((s, r) => s + r.resolved, 0);
        const pending = stats.pending ?? tagsData.reduce((s, r) => s + r.pending, 0);
        const inProgress = tagsData.reduce((s, r) => s + (r["in-progress"] || 0), 0);

        return {
            tagsData,
            pieData: [
                { name: "Resolved", value: resolved },
                { name: "Pending", value: pending },
                { name: "In Progress", value: inProgress },
            ],
            totals: { resolved, pending, inProgress, total: resolved + pending + inProgress }
        };
    }, [stats]);

    if (loading) return <div className="p-10 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;
    if (error) return <p className="p-10 text-center text-red-500">Error: {error}</p>;
    if (!stats) return <p className="p-10 text-center">No data available.</p>;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Faculty Statistics</h1>
                <p className="text-muted-foreground">Overview of university complaint resolution performance.</p>
            </header>

            {/* Metrics */}
            <div className="grid gap-6 sm:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totals.total}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{totals.resolved}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-yellow-600">{totals.pending}</div></CardContent></Card>
            </div>

            {/* Charts */}
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="p-6">
                    <CardTitle className="mb-6">Distribution by Category</CardTitle>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tagsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="tag" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="resolved" name="Resolved" stackId="a" fill={STATUS_COLORS.resolved} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="pending" name="Pending" stackId="a" fill={STATUS_COLORS.pending} />
                                <Bar dataKey="in-progress" name="In Progress" stackId="a" fill={STATUS_COLORS["in-progress"]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <CardTitle className="mb-6">Overall Resolution Status</CardTitle>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={index} fill={index === 0 ? STATUS_COLORS.resolved : index === 1 ? STATUS_COLORS.pending : STATUS_COLORS["in-progress"]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}