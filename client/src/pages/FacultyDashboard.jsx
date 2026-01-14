import React, { useEffect, useMemo, useState } from "react";
import {
    BarChart as RBarChart,
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

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "../components/ui/table";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "../components/ui/drawer";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { cn } from "../lib/utils";
import { CalendarIcon, Plus, Filter, Search, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const Q_BASE = `${API}/api/query`;

export default function FacultyDashboard() {
    const navigate = useNavigate();

    // Data
    const [stats, setStats] = useState(null);
    const [rawQueries, setRawQueries] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [status, setStatus] = useState("all");
    const [tag, setTag] = useState("all");
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState({ from: null, to: null });

    // Create complaint form state
    const [createOpen, setCreateOpen] = useState(false);
    const [formTag, setFormTag] = useState("");
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formFiles, setFormFiles] = useState([]);

    // Fetch all queries and stats
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [resQ, resS] = await Promise.all([
                fetch(`${Q_BASE}/queries`),
                fetch(`${Q_BASE}/queries/stats`),
            ]);
            const dataQ = await resQ.json();
            const items = Array.isArray(dataQ.items) ? dataQ.items : Array.isArray(dataQ) ? dataQ : [];
            setRawQueries(items);

            if (resS.ok) {
                const dataS = await resS.json();
                setStats(dataS);
            }
        } catch (e) {
            console.error("fetchAll error:", e);
            toast.error("Failed to load data", { description: e.message || "Please try again." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll().catch((e) => console.error(e));
    }, []);

    // Create complaint
    const createComplaint = async () => {
        if (!formTitle.trim()) {
            toast.message("Missing title", { description: "Please provide a short title." });
            return;
        }
        if (!formTag) {
            toast.message("Missing tag", { description: "Please select a tag." });
            return;
        }

        const fd = new FormData();
        fd.append("title", formTitle);
        fd.append("description", formDesc);
        fd.append("tags", formTag || "other");
        for (const f of formFiles) fd.append("documents", f);

        try {
            const res = await fetch(`${Q_BASE}/queries`, { method: "POST", body: fd });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                toast.error("Failed to create complaint", { description: text || `${res.status} ${res.statusText}` });
                return;
            }
            toast.success("Complaint created", { description: "The complaint has been submitted." });
            await fetchAll();
            setCreateOpen(false);
            setFormTag("");
            setFormTitle("");
            setFormDesc("");
            setFormFiles([]);
        } catch (e) {
            toast.error("Create failed", { description: e.message || "Please try again." });
        }
    };

    // Derived tag options
    const tagOptions = useMemo(() => {
        const set = new Set();
        for (const it of rawQueries) {
            const tags = Array.isArray(it.tags) ? it.tags : [it.tag].filter(Boolean);
            tags.forEach((t) => set.add(t));
        }
        return ["all", ...Array.from(set)];
    }, [rawQueries]);

    // Frontend filtering
    const filteredQueries = useMemo(() => {
        const start = dateRange.from ? new Date(dateRange.from).getTime() : null;
        const end = dateRange.to ? new Date(dateRange.to).getTime() : null;
        const q = (searchText || "").trim().toLowerCase();

        return (rawQueries || []).filter((it) => {
            if (status !== "all" && it.status !== status) return false;

            if (tag !== "all") {
                const tags = Array.isArray(it.tags) ? it.tags : [it.tag].filter(Boolean);
                if (!tags.includes(tag)) return false;
            }

            if (q) {
                const hay = `${it.title || ""} ${it.description || ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }

            if (start || end) {
                const t = it.createdAt ? new Date(it.createdAt).getTime() : null;
                if (!t) return false;
                if (start && t < start) return false;
                if (end && t > end) return false;
            }

            return true;
        });
    }, [rawQueries, status, tag, searchText, dateRange]);

    // KPIs
    const totalAll = filteredQueries.length;
    const totalPending = filteredQueries.filter((x) => x.status === "pending").length;
    const totalResolved = filteredQueries.filter((x) => x.status === "resolved").length;
    const totalInProgress = filteredQueries.filter((x) => x.status === "in-progress").length;

    // Charts
    const byTagMap = useMemo(() => {
        return filteredQueries.reduce((acc, it) => {
            const tags = Array.isArray(it.tags) ? it.tags : [it.tag || "unknown"];
            for (const tg of tags) {
                if (!acc[tg]) acc[tg] = { tag: tg, resolved: 0, pending: 0, "in-progress": 0 };
                acc[tg][it.status] = (acc[tg][it.status] || 0) + 1;
            }
            return acc;
        }, {});
    }, [filteredQueries]);

    const tagsData = Object.values(byTagMap);
    const hasBarData = tagsData.length > 0 && tagsData.some((d) => d.resolved || d.pending || d["in-progress"]);

    const pieData = [
        { name: "Pending", value: totalPending },
        { name: "Resolved", value: totalResolved },
        { name: "All", value: totalAll },
    ];
    const hasPieData = pieData.some((d) => d.value > 0);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Faculty Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Manage complaints and monitor status</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search complaints..."
                            className="pl-8 w-64"
                            value={searchText}
                            onChange={(e) =>
                                e.target.value === "" ? setSearchText("") : setSearchText(e.target.value)
                            }
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => toast.message("Filters applied", { description: "Updated the list below." })}
                    >
                        <Filter className="h-4 w-4" />
                        Apply
                    </Button>
                    <Drawer open={createOpen} onOpenChange={setCreateOpen}>
                        <DrawerTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Complaint
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-2xl">
                                <DrawerHeader>
                                    <DrawerTitle>Submit Complaint</DrawerTitle>
                                    <DrawerDescription>Provide details and evidence if any</DrawerDescription>
                                </DrawerHeader>
                                <div className="p-6 grid gap-4">
                                    <div className="grid gap-2">
                                        <Label>Tag</Label>
                                        <Select value={formTag} onValueChange={setFormTag}>
                                            <SelectTrigger><SelectValue placeholder="Choose a tag" /></SelectTrigger>
                                            <SelectContent>
                                                {tagOptions.filter((t) => t !== "all").map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                                <SelectItem value="other">other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="Short summary"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={formDesc}
                                            onChange={(e) => setFormDesc(e.target.value)}
                                            placeholder="Describe the issue..."
                                            rows={5}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Attachments</Label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => document.getElementById("file-input").click()}
                                            >
                                                <UploadCloud className="h-4 w-4" />
                                                Upload files
                                            </Button>
                                            <input
                                                id="file-input"
                                                type="file"
                                                className="hidden"
                                                multiple
                                                onChange={(e) => setFormFiles(Array.from(e.target.files || []))}
                                            />
                                            {formFiles?.length ? (
                                                <span className="text-sm text-muted-foreground">
                                                    {formFiles.length} file(s)
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                <DrawerFooter className="flex gap-2">
                                    <Button onClick={createComplaint} disabled={!formTag || !formTitle}>
                                        Submit
                                    </Button>
                                    <DrawerClose asChild>
                                        <Button
                                            variant="outline"
                                            onClick={() => toast.message("Cancelled", { description: "Form was closed." })}
                                        >
                                            Cancel
                                        </Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-4 gap-4">
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In-Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Tag</Label>
                        <Select value={tag} onValueChange={setTag}>
                            <SelectTrigger><SelectValue placeholder="Select tag" /></SelectTrigger>
                            <SelectContent>
                                {tagOptions.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Date from</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn("justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? dateRange.from.toDateString() : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateRange.from}
                                    onSelect={(d) => setDateRange((r) => ({ ...r, from: d }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label>Date to</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn("justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.to ? dateRange.to.toDateString() : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateRange.to}
                                    onSelect={(d) => setDateRange((r) => ({ ...r, to: d }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs */}
            <section className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{totalAll}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold text-yellow-500">{totalPending}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>In-Progress</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold text-blue-500">{totalInProgress}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Resolved</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold text-green-600">{totalResolved}</CardContent>
                </Card>
            </section>

            {/* Charts */}
            <section className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Complaints by Tags</CardTitle></CardHeader>
                    <CardContent className="h-80">
                        {hasBarData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RBarChart data={tagsData}>
                                    <XAxis dataKey="tag" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="resolved" stackId="a" fill="#22c55e" />
                                    <Bar dataKey="pending" stackId="a" fill="#eab308" />
                                    <Bar dataKey="in-progress" stackId="a" fill="#3b82f6" />
                                </RBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                No tag data
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Overall Status Distribution</CardTitle></CardHeader>
                    <CardContent className="h-80 flex items-center justify-center">
                        {hasPieData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value" label>
                                        {pieData.map((entry) => {
                                            const color =
                                                entry.name === "Pending" ? "#eab308" :
                                                    entry.name === "Resolved" ? "#22c55e" : "#3b82f6";
                                            return <Cell key={entry.name} fill={color} />;
                                        })}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                No status data
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Recent complaints */}
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Recent Complaints</CardTitle>
                    <Tabs defaultValue="all">
                        <TabsList>
                            <TabsTrigger value="all" onClick={() => setStatus("all")}>All</TabsTrigger>
                            <TabsTrigger value="pending" onClick={() => setStatus("pending")}>Pending</TabsTrigger>
                            <TabsTrigger value="in-progress" onClick={() => setStatus("in-progress")}>In-Progress</TabsTrigger>
                            <TabsTrigger value="resolved" onClick={() => setStatus("resolved")}>Resolved</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Tag(s)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(filteredQueries || []).map((q) => (
                                    <TableRow
                                        key={q._id}
                                        className="cursor-pointer hover:bg-accent/40"
                                        onClick={() => navigate(`/queries/${q._id}`)}
                                    >
                                        <TableCell className="font-medium">{q.title}</TableCell>
                                        <TableCell>{Array.isArray(q.tags) ? q.tags.join(", ") : q.tag || "-"}</TableCell>
                                        <TableCell>
                                            {q.status === "resolved" && <Badge className="bg-green-600">Resolved</Badge>}
                                            {q.status === "pending" && <Badge className="bg-yellow-500">Pending</Badge>}
                                            {q.status === "in-progress" && <Badge className="bg-blue-500">In-Progress</Badge>}
                                        </TableCell>
                                        <TableCell>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "-"}</TableCell>
                                    </TableRow>
                                ))}
                                {!loading && (filteredQueries || []).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                                            No complaints found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

