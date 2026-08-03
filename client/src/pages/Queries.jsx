import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "../components/ui/popover";
import {
    Command,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "../components/ui/command";
import { Badge } from "../components/ui/badge";
import api from "../lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import useMentionSearch from "../hooks/useMentionSearch";
import { CalendarDays } from "lucide-react";

const statusOptions = ["pending", "in-progress", "resolved"];
const TAGS = [
    "water",
    "mess",
    "internet",
    "washroom",
    "electricity",
    "maintenance",
];
const SCOPE_OPTIONS = ["room", "floor", "block", "hostel", "campus"];

const INITIAL_QUERY_STATE = {
    title: "",
    description: "",
    student: "",
    files: [],
    scope: "room",
    campus: "main-campus",
    hostel: "",
    block: "",
    floor: "",
    roomNumber: "",
};

const logAxiosError = (label, error) => {
    if (error?.response) {
        console.error(label, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method,
        });
    } else if (error?.request) {
        console.error(label, "No response received", {
            url: error.config?.url,
        });
    } else {
        console.error(label, error?.message);
    }
};

const normalizeQueryForScope = (query, nextScope) => {
    const next = { ...query, scope: nextScope };

    if (nextScope === "campus") {
        next.hostel = "";
        next.block = "";
        next.floor = "";
        next.roomNumber = "";
    } else if (nextScope === "hostel") {
        next.block = "";
        next.floor = "";
        next.roomNumber = "";
    } else if (nextScope === "block") {
        next.floor = "";
        next.roomNumber = "";
    } else if (nextScope === "floor") {
        next.roomNumber = "";
    }

    return next;
};

const getHostelLabel = (hostel) => {
    if (!hostel) return "";
    if (typeof hostel === "object") return hostel.name || hostel._id || "";
    return hostel;
};

export default function Queries() {
    const { user } = useSelector((state) => state.auth);

    const [queries, setQueries] = useState([]);
    const [newQuery, setNewQuery] = useState({
        ...INITIAL_QUERY_STATE,
        student: user?._id || "",
    });

    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [hasTrigger, setHasTrigger] = useState(false);

    const [selectedTags, setSelectedTags] = useState([]);
    const [openTags, setOpenTags] = useState(false);

    const {
        items,
        loading: searching,
        search,
        clear,
    } = useMentionSearch({ minChars: 0, limit: 8 });

    const [triggerStart, setTriggerStart] = useState(null);
    const [cursorPos, setCursorPos] = useState(0);
    const textareaRef = useRef(null);
    const [openMention, setOpenMention] = useState(false);

    useEffect(() => {
        setNewQuery((prev) => ({
            ...prev,
            student: user?._id || "",
        }));
    }, [user]);

    useEffect(() => {
        setOpenMention(hasTrigger && (items.length > 0 || searching));
    }, [items, searching, hasTrigger]);

    const fetchQueries = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.get("/query/queries", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const items = Array.isArray(data) ? data : [];
            setQueries(items);
        } catch (err) {
            logAxiosError("fetchQueries", err);
            const msg = err.response?.data?.message || err.message;
            toast.error("Failed to load queries", { description: msg });
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const toggleTag = (tag) => {
        setSelectedTags((prev) =>
            prev.includes(tag)
                ? prev.filter((x) => x !== tag)
                : [...prev, tag]
        );
    };

    const removeTag = (tag) => {
        setSelectedTags((prev) => prev.filter((x) => x !== tag));
    };

    const onDescriptionChange = (e) => {
        const text = e.target.value;
        const pos = e.target.selectionStart;

        setCursorPos(pos);
        setNewQuery((prev) => ({ ...prev, description: text }));

        const slice = text.slice(0, pos);
        const match = slice.match(/@([a-z0-9_.]{0,30})$/i);

        if (match) {
            setHasTrigger(true);
            setTriggerStart(pos - match[0].length);
            const qstr = (match[1] || "").toLowerCase();
            search(qstr);
        } else {
            setHasTrigger(false);
            setTriggerStart(null);
            clear();
            setOpenMention(false);
        }
    };

    const insertHandle = (username) => {
        if (triggerStart == null) return;

        const text = newQuery.description;
        const before = text.slice(0, triggerStart);
        const after = text.slice(cursorPos);
        const next = `${before}@${username} ${after}`;

        setNewQuery((prev) => ({ ...prev, description: next }));
        clear();
        setTriggerStart(null);
        setHasTrigger(false);
        setOpenMention(false);

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                const newPos = `${before}@${username} `.length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        });
    };

    const handleScopeChange = (value) => {
        setNewQuery((prev) => normalizeQueryForScope(prev, value));
    };

    const resetForm = () => {
        setNewQuery({
            ...INITIAL_QUERY_STATE,
            student: user?._id || "",
        });
        setSelectedTags([]);
        setHasTrigger(false);
        setTriggerStart(null);
        setCursorPos(0);
        setOpenMention(false);
        clear();
    };

    const handleCreate = async () => {
        const {
            title,
            description,
            student,
            files,
            scope,
            campus,
            hostel,
            block,
            floor,
            roomNumber,
        } = newQuery;

        if (!title.trim() || !description.trim() || !student) {
            toast.message("Missing fields", {
                description: "Title and description are required.",
            });
            return;
        }

        if (selectedTags.length === 0) {
            toast.message("Select tags", {
                description: "Pick at least one relevant tag.",
            });
            return;
        }

        if (scope !== "campus" && !hostel.trim()) {
            toast.message("Hostel required", {
                description: "Please provide hostel for non-campus complaints.",
            });
            return;
        }

        if (["room", "floor", "block"].includes(scope) && !block.trim()) {
            toast.message("Block required", {
                description: `Please provide block for ${scope} scope complaint.`,
            });
            return;
        }

        if (["room", "floor"].includes(scope) && !floor.trim()) {
            toast.message("Floor required", {
                description: `Please provide floor for ${scope} scope complaint.`,
            });
            return;
        }

        if (scope === "room" && !roomNumber.trim()) {
            toast.message("Room number required", {
                description: "Please provide room number for room scope complaint.",
            });
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const fd = new FormData();
            fd.append("student", student);
            fd.append("title", title.trim());
            fd.append("description", description.trim());
            fd.append("scope", scope);
            fd.append("campus", campus.trim());

            if (hostel.trim()) fd.append("hostel", hostel.trim());
            if (block.trim()) fd.append("block", block.trim());
            if (floor.trim()) fd.append("floor", floor.trim());
            if (roomNumber.trim()) fd.append("roomNumber", roomNumber.trim());

            selectedTags.forEach((tag) => fd.append("tags", tag));
            (files || []).forEach((file) => fd.append("documents", file));

            const { data } = await api.post("/query/queries", fd, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const createdQuery = data?.query || data?.joinedQuery || data;

            if (createdQuery?._id) {
                setQueries((prev) => {
                    const existingIndex = prev.findIndex(
                        (item) => item._id === createdQuery._id
                    );

                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = createdQuery;
                        return updated;
                    }

                    return [createdQuery, ...(Array.isArray(prev) ? prev : [])];
                });
            } else {
                fetchQueries();
            }

            resetForm();

            toast.success(
                data?.isDuplicate
                    ? "Joined existing complaint"
                    : "Query created",
                {
                    description:
                        data?.message ||
                        (data?.isDuplicate
                            ? "Your support increased the priority of the existing complaint."
                            : "Your query was submitted successfully."),
                }
            );
        } catch (err) {
            logAxiosError("handleCreate", err);
            const msg = err.response?.data?.message || err.message;
            toast.error("Create failed", { description: msg });
        } finally {
            setLoading(false);
        }
    };

    const filteredQueries =
        filterStatus === "all"
            ? queries
            : queries.filter((q) => q.status === filterStatus);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Queries</h1>

            {user?.role !== "faculty" && (
                <Card className="p-4 space-y-4">
                    <CardHeader>
                        <CardTitle>Create a new Query</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Title"
                            value={newQuery.title}
                            onChange={(e) =>
                                setNewQuery((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                        />

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Problems: </label>

                            <div className="flex flex-wrap gap-2">
                                {selectedTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground border flex items-center gap-1"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={() => removeTag(tag)}
                                            aria-label={`Remove ${tag}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}

                                <Popover open={openTags} onOpenChange={setOpenTags}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" type="button">
                                            {selectedTags.length
                                                ? "Edit tags"
                                                : "Select tags"}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="w-64 p-0"
                                        align="start"
                                        side="bottom"
                                    >
                                        <Command>
                                            <CommandList className="max-h-60 overflow-auto">
                                                <CommandEmpty>No tags</CommandEmpty>
                                                <CommandGroup heading="Available">
                                                    {TAGS.map((tag) => {
                                                        const active =
                                                            selectedTags.includes(tag);

                                                        return (
                                                            <CommandItem
                                                                key={tag}
                                                                value={tag}
                                                                onSelect={() =>
                                                                    toggleTag(tag)
                                                                }
                                                                className="flex items-center justify-between"
                                                            >
                                                                <span className="capitalize">
                                                                    {tag}
                                                                </span>
                                                                <span
                                                                    className={`h-4 w-4 rounded border ${active
                                                                        ? "bg-primary border-primary"
                                                                        : "bg-transparent"
                                                                        }`}
                                                                />
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="grid gap-1">
                                <label className="text-sm font-medium">Scope</label>
                                <select
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    value={newQuery.scope}
                                    onChange={(e) =>
                                        handleScopeChange(e.target.value)
                                    }
                                >
                                    {SCOPE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option.charAt(0).toUpperCase() +
                                                option.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1">
                                <label className="text-sm font-medium">Campus</label>
                                <Input
                                    placeholder="Campus"
                                    value={newQuery.campus}
                                    onChange={(e) =>
                                        setNewQuery((prev) => ({
                                            ...prev,
                                            campus: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            {newQuery.scope !== "campus" && (
                                <div className="grid gap-1">
                                    <label className="text-sm font-medium">
                                        Hostel
                                    </label>
                                    <Input
                                        placeholder="Hostel ID / Hostel Name"
                                        value={newQuery.hostel}
                                        onChange={(e) =>
                                            setNewQuery((prev) => ({
                                                ...prev,
                                                hostel: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            {["room", "floor", "block"].includes(
                                newQuery.scope
                            ) && (
                                    <div className="grid gap-1">
                                        <label className="text-sm font-medium">
                                            Block
                                        </label>
                                        <Input
                                            placeholder="Block"
                                            value={newQuery.block}
                                            onChange={(e) =>
                                                setNewQuery((prev) => ({
                                                    ...prev,
                                                    block: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                )}

                            {["room", "floor"].includes(newQuery.scope) && (
                                <div className="grid gap-1">
                                    <label className="text-sm font-medium">
                                        Floor
                                    </label>
                                    <Input
                                        placeholder="Floor"
                                        value={newQuery.floor}
                                        onChange={(e) =>
                                            setNewQuery((prev) => ({
                                                ...prev,
                                                floor: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            {newQuery.scope === "room" && (
                                <div className="grid gap-1">
                                    <label className="text-sm font-medium">
                                        Room Number
                                    </label>
                                    <Input
                                        placeholder="Room Number"
                                        value={newQuery.roomNumber}
                                        onChange={(e) =>
                                            setNewQuery((prev) => ({
                                                ...prev,
                                                roomNumber: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <Popover open={openMention} onOpenChange={setOpenMention}>
                            <PopoverTrigger asChild>
                                <div className="relative">
                                    <Textarea
                                        ref={textareaRef}
                                        placeholder="Describe your issue. Type @ to mention someone (e.g. @ravi_sharma)."
                                        value={newQuery.description}
                                        onChange={onDescriptionChange}
                                        rows={5}
                                    />
                                </div>
                            </PopoverTrigger>

                            <PopoverContent
                                focusRef={textareaRef}
                                align="start"
                                side="bottom"
                                className="w-80 p-0"
                                sideOffset={8}
                            >
                                <Command shouldFilter={false}>
                                    <CommandList className="max-h-64 overflow-auto">
                                        <CommandEmpty>
                                            {searching ? "Searching…" : "No matches"}
                                        </CommandEmpty>

                                        <CommandGroup heading="Users">
                                            {items.map((u) => (
                                                <CommandItem
                                                    key={u.id}
                                                    value={u.username}
                                                    onSelect={() =>
                                                        insertHandle(u.username)
                                                    }
                                                    onPointerMove={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    onPointerLeave={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="font-medium">
                                                        @{u.username}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {u.name}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="ml-auto uppercase text-[10px]"
                                                    >
                                                        {u.role}
                                                    </Badge>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <input
                            type="file"
                            multiple
                            onChange={(e) =>
                                setNewQuery((prev) => ({
                                    ...prev,
                                    files: Array.from(e.target.files || []),
                                }))
                            }
                        />

                        <Button
                            onClick={handleCreate}
                            disabled={
                                loading || searching || selectedTags.length === 0
                            }
                        >
                            {loading ? "Creating..." : "Create Query"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    onClick={() => setFilterStatus("all")}
                >
                    All
                </Button>

                {statusOptions.map((status) => (
                    <Button
                        key={status}
                        variant={filterStatus === status ? "default" : "outline"}
                        onClick={() => setFilterStatus(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredQueries.map((q) => (
                    <Link key={q._id} to={`/queries/${q._id}`}>
                        <Card className="space-y-2 cursor-pointer hover:shadow-lg transition">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center gap-3">
                                    <span className="line-clamp-1">{q.title}</span>

                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${q.status === "pending"
                                            ? "bg-yellow-200 text-yellow-800"
                                            : q.status === "in-progress"
                                                ? "bg-blue-200 text-blue-800"
                                                : "bg-green-200 text-green-800"
                                            }`}
                                    >
                                        {q.status}
                                    </span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                <p className="line-clamp-3">{q.description}</p>

                                {Array.isArray(q.tags) && q.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {q.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[10px] px-2 py-0.5 rounded-full border"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${q.priority === "urgent"
                                            ? "bg-red-500 text-white"
                                            : q.priority === "high"
                                                ? "bg-orange-400 text-white"
                                                : q.priority === "medium"
                                                    ? "bg-yellow-300 text-black"
                                                    : "bg-gray-300 text-black"
                                            }`}
                                    >
                                        {q.priority || "low"}
                                    </span>

                                    {q.scope && (
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border">
                                            {q.scope}
                                        </span>
                                    )}

                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 border">
                                        upvotes : {q.supportCount || 1}
                                    </span>
                                </div>

                                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                    {q.campus && <div>Campus: {q.campus}</div>}
                                    {q.hostel && (
                                        <div>Hostel: {getHostelLabel(q.hostel)}</div>
                                    )}
                                    {q.block && <div>Block: {q.block}</div>}
                                    {q.floor && <div>Floor: {q.floor}</div>}
                                    {q.roomNumber && (
                                        <div>Room: {q.roomNumber}</div>
                                    )}
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px]">
                                    <CalendarDays className="h-2 w-2" />
                                    {q?.createdAt
                                        ? new Date(q.createdAt).toLocaleString()
                                        : "Unknown date"}
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}