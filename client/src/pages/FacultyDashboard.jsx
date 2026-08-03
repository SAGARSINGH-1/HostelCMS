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
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Plus, Filter, Search, UploadCloud, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "../components/ui/drawer";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import CustomSelect from "../components/ui/CustomSelect";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "../components/ui/select";
import { cn } from "../lib/utils";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const Q_BASE = `${API}/api/query`;

const STATUS_OPTIONS = ["all", "pending", "in-progress", "resolved"];
const TAG_OPTIONS = [
    "water",
    "mess",
    "internet",
    "washroom",
    "electricity",
    "maintenance",
    "other",
];
const SCOPE_OPTIONS = ["room", "floor", "block", "hostel", "campus"];

const PIE_COLORS = {
    pending: "#eab308",
    "in-progress": "#3b82f6",
    resolved: "#22c55e",
};

const PRIORITY_BADGE = {
    low: "bg-slate-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-600",
};

export default function FacultyDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [rawQueries, setRawQueries] = useState([]);
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState("all");
    const [tag, setTag] = useState("all");
    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState({ from: null, to: null });

    const [createOpen, setCreateOpen] = useState(false);
    const [formTag, setFormTag] = useState("other");
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formScope, setFormScope] = useState("room");
    const [formCampus, setFormCampus] = useState("main-campus");
    const [formHostel, setFormHostel] = useState("");
    const [formBlock, setFormBlock] = useState("");
    const [formFloor, setFormFloor] = useState("");
    const [formRoomNumber, setFormRoomNumber] = useState("");
    const [formFiles, setFormFiles] = useState([]);

    const normalize = (value = "") => String(value || "").trim().toLowerCase();

    const resetForm = () => {
        setFormTag("other");
        setFormTitle("");
        setFormDesc("");
        setFormScope("room");
        setFormCampus("main-campus");
        setFormHostel("");
        setFormBlock("");
        setFormFloor("");
        setFormRoomNumber("");
        setFormFiles([]);
    };

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
            } else {
                setStats(null);
            }
        } catch (e) {
            console.error("fetchAll error:", e);
            toast.error("Failed to load data", {
                description: e.message || "Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll().catch((e) => console.error(e));
    }, []);

    const createComplaint = async () => {
        if (!formTitle.trim()) {
            toast.message("Missing title", {
                description: "Please provide a short title.",
            });
            return;
        }

        if (!formDesc.trim()) {
            toast.message("Missing description", {
                description: "Please provide complaint details.",
            });
            return;
        }

        if (!formTag) {
            toast.message("Missing tag", {
                description: "Please select a tag.",
            });
            return;
        }

        const fd = new FormData();
        fd.append("title", formTitle.trim());
        fd.append("description", formDesc.trim());
        fd.append("tags", normalize(formTag) || "other");
        fd.append("scope", normalize(formScope) || "room");
        fd.append("campus", formCampus.trim() || "main-campus");
        fd.append("hostel", formHostel.trim());
        fd.append("block", formBlock.trim());
        fd.append("floor", formFloor.trim());
        fd.append("roomNumber", formRoomNumber.trim());

        for (const f of formFiles) {
            fd.append("documents", f);
        }

        try {
            const res = await fetch(`${Q_BASE}/queries`, {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                toast.error("Failed to create complaint", {
                    description: text || `${res.status} ${res.statusText}`,
                });
                return;
            }

            const payload = await res.json().catch(() => null);

            if (payload?.duplicateMatched || payload?.duplicateOf) {
                toast.success("Joined existing complaint", {
                    description: "A similar complaint already existed, so support count was updated.",
                });
            } else {
                toast.success("Complaint created", {
                    description: "The complaint has been submitted.",
                });
            }

            await fetchAll();
            setCreateOpen(false);
            resetForm();
        } catch (e) {
            toast.error("Create failed", {
                description: e.message || "Please try again.",
            });
        }
    };

    const tagOptions = useMemo(() => {
        const set = new Set(TAG_OPTIONS);
        for (const it of rawQueries) {
            const tags = Array.isArray(it.tags) ? it.tags : [it.tag].filter(Boolean);
            tags.forEach((t) => set.add(normalize(t)));
        }
        return ["all", ...Array.from(set).filter(Boolean)];
    }, [rawQueries]);

    const filteredQueries = useMemo(() => {
        const start = dateRange.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
        const end = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null;
        const q = normalize(searchText);

        return (rawQueries || []).filter((it) => {
            if (status !== "all" && it.status !== status) return false;

            if (tag !== "all") {
                const tags = Array.isArray(it.tags) ? it.tags.map(normalize) : [normalize(it.tag)].filter(Boolean);
                if (!tags.includes(normalize(tag))) return false;
            }

            if (q) {
                const hay = [
                    it.title,
                    it.description,
                    it.hostel,
                    it.block,
                    it.floor,
                    it.roomNumber,
                    it.scope,
                    Array.isArray(it.tags) ? it.tags.join(" ") : it.tag || "",
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

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

    const totalAll = filteredQueries.length;
    const totalPending = filteredQueries.filter((x) => x.status === "pending").length;
    const totalResolved = filteredQueries.filter((x) => x.status === "resolved").length;
    const totalInProgress = filteredQueries.filter((x) => x.status === "in-progress").length;

    const totalSupport = filteredQueries.reduce((sum, item) => sum + (item.supportCount || 1), 0);
    const mergedCount = filteredQueries.filter((item) => item.isMerged || item.duplicateOf).length;

    const byTagMap = useMemo(() => {
        return filteredQueries.reduce((acc, it) => {
            const tags = Array.isArray(it.tags) ? it.tags : [it.tag || "other"];
            for (const tg of tags) {
                const key = normalize(tg) || "other";
                if (!acc[key]) {
                    acc[key] = {
                        tag: key,
                        resolved: 0,
                        pending: 0,
                        "in-progress": 0,
                    };
                }
                acc[key][it.status] = (acc[key][it.status] || 0) + 1;
            }
            return acc;
        }, {});
    }, [filteredQueries]);

    const tagsData = Object.values(byTagMap);
    const hasBarData = tagsData.length > 0 && tagsData.some((d) => d.resolved || d.pending || d["in-progress"]);

    const pieData = [
        { name: "Pending", key: "pending", value: totalPending },
        { name: "In-Progress", key: "in-progress", value: totalInProgress },
        { name: "Resolved", key: "resolved", value: totalResolved },
    ].filter((d) => d.value > 0);

    const hasPieData = pieData.length > 0;

    const visibleQueries = useMemo(() => {
        return [...filteredQueries].sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const pa = priorityOrder[a.priority] || 0;
            const pb = priorityOrder[b.priority] || 0;

            if (pb !== pa) return pb - pa;
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
    }, [filteredQueries]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Faculty Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage complaints, routing, support counts, and status
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search complaints..."
                            className="pl-8 w-full md:w-72"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => fetchAll()}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>

                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                            toast.message("Filters applied", {
                                description: "Updated the list below.",
                            })
                        }
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
                                    <DrawerDescription>
                                        Add issue details, location, and attachments
                                    </DrawerDescription>
                                </DrawerHeader>

                                <div className="p-6 grid gap-4 max-h-[75vh] overflow-y-auto">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Tag</Label>
                                            <CustomSelect
                                                value={formTag}
                                                onChange={setFormTag}
                                                options={TAG_OPTIONS}
                                                placeholder="Choose a tag"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Scope</Label>
                                            <CustomSelect
                                                value={formScope}
                                                onChange={setFormScope}
                                                options={SCOPE_OPTIONS}
                                                placeholder="Choose scope"
                                            />
                                        </div>
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

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Campus</Label>
                                            <Input
                                                value={formCampus}
                                                onChange={(e) => setFormCampus(e.target.value)}
                                                placeholder="main-campus"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Hostel</Label>
                                            <Input
                                                value={formHostel}
                                                onChange={(e) => setFormHostel(e.target.value)}
                                                placeholder="e.g. ramanujan hostel"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Block</Label>
                                            <Input
                                                value={formBlock}
                                                onChange={(e) => setFormBlock(e.target.value)}
                                                placeholder="e.g. A"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Floor</Label>
                                            <Input
                                                value={formFloor}
                                                onChange={(e) => setFormFloor(e.target.value)}
                                                placeholder="e.g. 2"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Room Number</Label>
                                        <Input
                                            value={formRoomNumber}
                                            onChange={(e) => setFormRoomNumber(e.target.value)}
                                            placeholder="e.g. 214"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Attachments</Label>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => document.getElementById("file-input")?.click()}
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
                                                    {formFiles.length} file(s) selected
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <DrawerFooter className="flex gap-2">
                                    <Button
                                        onClick={createComplaint}
                                        disabled={!formTag || !formTitle.trim() || !formDesc.trim()}
                                    >
                                        Submit
                                    </Button>

                                    <DrawerClose asChild>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                resetForm();
                                                toast.message("Cancelled", {
                                                    description: "Form was closed.",
                                                });
                                            }}
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

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>

                <CardContent className="grid md:grid-cols-4 gap-4">
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {item === "in-progress"
                                            ? "In-Progress"
                                            : item.charAt(0).toUpperCase() + item.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Tag</Label>
                        <CustomSelect
                            value={tag}
                            onChange={setTag}
                            options={tagOptions}
                            placeholder="Select tag"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Date from</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "justify-start text-left font-normal",
                                        !dateRange.from && "text-muted-foreground"
                                    )}
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
                                    className={cn(
                                        "justify-start text-left font-normal",
                                        !dateRange.to && "text-muted-foreground"
                                    )}
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

            <section className="grid md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold">{totalAll}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-yellow-500">
                        {totalPending}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>In-Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-blue-500">
                        {totalInProgress}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resolved</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-green-600">
                        {totalResolved}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Total Support</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-purple-600">
                        {totalSupport}
                    </CardContent>
                </Card>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Complaints by Tags</CardTitle>
                    </CardHeader>
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
                    <CardHeader>
                        <CardTitle>Overall Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 flex items-center justify-center">
                        {hasPieData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        dataKey="value"
                                        nameKey="name"
                                        label
                                    >
                                        {pieData.map((entry) => (
                                            <Cell
                                                key={entry.key}
                                                fill={PIE_COLORS[entry.key] || "#8884d8"}
                                            />
                                        ))}
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

            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <CardTitle>Recent Complaints</CardTitle>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline">Merged/Duplicates: {mergedCount}</Badge>
                        <Tabs value={status} onValueChange={setStatus}>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="in-progress">In-Progress</TabsTrigger>
                                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Support</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {visibleQueries.map((q) => {
                                    const location = [q.hostel, q.block, q.floor, q.roomNumber]
                                        .filter(Boolean)
                                        .join(" / ");

                                    return (
                                        <TableRow
                                            key={q._id}
                                            className="cursor-pointer hover:bg-accent/40"
                                            onClick={() => navigate(`/queries/${q._id}`)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span>{q.title}</span>
                                                    {(q.duplicateOf || q.isMerged) && (
                                                        <Badge variant="outline">Merged</Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {Array.isArray(q.tags) && q.tags.length ? q.tags.join(", ") : q.tag || "-"}
                                            </TableCell>

                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{location || "-"}</div>
                                                    <div className="text-muted-foreground">{q.scope || "-"}</div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge className={PRIORITY_BADGE[q.priority] || "bg-slate-500"}>
                                                    {q.priority || "medium"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>{q.supportCount || 1}</TableCell>

                                            <TableCell>
                                                {q.status === "resolved" && (
                                                    <Badge className="bg-green-600">Resolved</Badge>
                                                )}
                                                {q.status === "pending" && (
                                                    <Badge className="bg-yellow-500">Pending</Badge>
                                                )}
                                                {q.status === "in-progress" && (
                                                    <Badge className="bg-blue-500">In-Progress</Badge>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "-"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {!loading && visibleQueries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                                            No complaints found
                                        </TableCell>
                                    </TableRow>
                                )}

                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                                            Loading complaints...
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