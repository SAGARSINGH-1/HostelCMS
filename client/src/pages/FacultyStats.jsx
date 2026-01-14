import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchQueryStats } from "../store/querySlice";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { toast } from "sonner";

const COLORS = ["#22c55e", "#eab308", "#3b82f6", "#ef4444", "#a855f7"];

export default function FacultyStats() {
    const dispatch = useDispatch();
    const { stats, loading, error } = useSelector((state) => state.query);

    useEffect(() => {
        (async () => {
            const action = await dispatch(fetchQueryStats());
            const payload = action?.payload;
            if (action?.type?.endsWith("/fulfilled")) {
                const total = payload?.total ?? 0;
                const resolved = payload?.resolved ?? 0;
                const pending = payload?.pending ?? 0;
                toast.success("Stats loaded", {
                    description: `Total: ${total}, Resolved: ${resolved}, Pending: ${pending}`,
                });
            } else if (action?.type?.endsWith("/rejected")) {
                const msg = (payload && payload.message) || error || "Unable to load statistics";
                toast.error("Failed to load stats", { description: msg });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    if (loading) return <p className="text-center">Loading stats...</p>;
    if (error) {
        // ensure toast shown if the slice error appears outside the useEffect flow
        toast.error("Failed to load stats", { description: error });
        return <p className="text-center text-red-500">{error}</p>;
    }
    if (!stats) {
        toast.message("No data", { description: "Statistics are currently unavailable." });
        return <p className="text-center">No stats available.</p>;
    }

    const raw = Array.isArray(stats.byTags) ? stats.byTags : [];

    const byTagMap = raw.reduce((acc, doc) => {
        const tag = doc?._id?.tag ?? "unknown";
        const status = doc?._id?.status ?? "unknown";
        const count = Number(doc?.count ?? 0);

        if (!acc[tag]) {
            acc[tag] = { tag, resolved: 0, pending: 0, "in-progress": 0, unknown: 0 };
        }
        if (status in acc[tag]) {
            acc[tag][status] += count;
        } else {
            acc[tag].unknown += count;
        }
        return acc;
    }, {});

    const tagsData = Object.values(byTagMap);

    const totalResolved =
        (typeof stats.resolved === "number"
            ? stats.resolved
            : tagsData.reduce((s, r) => s + Number(r.resolved || 0), 0)) || 0;

    const totalPending =
        (typeof stats.pending === "number"
            ? stats.pending
            : tagsData.reduce((s, r) => s + Number(r.pending || 0), 0)) || 0;

    const totalInProgress = tagsData.reduce(
        (s, r) => s + Number(r["in-progress"] || 0),
        0
    );
    const totalUnknown = tagsData.reduce((s, r) => s + Number(r.unknown || 0), 0);

    const totalAll =
        (typeof stats.total === "number"
            ? stats.total
            : totalResolved + totalPending + totalInProgress + totalUnknown) || 0;

    const pieData = [
        { name: "Pending", value: totalPending },
        { name: "Resolved", value: totalResolved },
        { name: "All", value: totalAll },
    ];

    const hasBarData =
        tagsData.length > 0 &&
        tagsData.some((d) => d.resolved || d.pending || d["in-progress"] || d.unknown);
    const hasPieData = pieData.some((d) => d.value > 0);

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">
                Faculty Complaint Statistics
            </h1>

            {/* Overall Stats */}
            <section className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Complaints</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {Number(totalAll)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Resolved</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-green-600">
                        {Number(totalResolved)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-yellow-500">
                        {Number(totalPending)}
                    </CardContent>
                </Card>
            </section>

            {/* Tag-wise Complaint Distribution */}
            <section className="grid md:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Complaints by Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {hasBarData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tagsData}>
                                    <XAxis dataKey="tag" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="resolved" stackId="a" fill="#22c55e" />
                                    <Bar dataKey="pending" stackId="a" fill="#eab308" />
                                    <Bar dataKey="in-progress" stackId="a" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-slate-500">
                                No tag data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 flex justify-center items-center">
                        {hasPieData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label
                                    >
                                        {pieData.map((entry, index) => {
                                            const color =
                                                entry.name === "Pending"
                                                    ? "#eab308"
                                                    : entry.name === "Resolved"
                                                        ? "#22c55e"
                                                        : "#3b82f6";
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-slate-500">
                                No status data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
