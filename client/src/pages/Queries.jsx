import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
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

const statusOptions = ["pending", "in-progress", "resolved"];
const TAGS = ["water", "mess", "internet", "washroom", "electricity", "maintenance"];

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
        console.error(label, "No response received", { url: error.config?.url });
    } else {
        console.error(label, error?.message);
    }
};

export default function Queries() {
    const { user } = useSelector((state) => state.auth);
    const [queries, setQueries] = useState([]);
    const [newQuery, setNewQuery] = useState({
        title: "",
        description: "",
        student: user._id,
        files: [],
    });
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [hasTrigger, setHasTrigger] = useState(false);

    // Tags multi-select
    const [selectedTags, setSelectedTags] = useState([]);
    const [openTags, setOpenTags] = useState(false);

    const toggleTag = (t) => {
        setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    };
    const removeTag = (t) => setSelectedTags((prev) => prev.filter((x) => x !== t));

    // Mentions state
    const { items, loading: searching, search, clear } = useMentionSearch({ minChars: 0, limit: 8 });
    const [triggerStart, setTriggerStart] = useState(null);
    const [cursorPos, setCursorPos] = useState(0);
    const textareaRef = useRef(null);
    const [openMention, setOpenMention] = useState(false);

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

    useEffect(() => {
        // Only show while there's an active '@' trigger
        setOpenMention(hasTrigger && (items.length > 0 || searching));
    }, [items, searching, hasTrigger]);


    const onDescriptionChange = (e) => {
        const t = e.target.value;
        const pos = e.target.selectionStart;
        setCursorPos(pos);
        setNewQuery((q) => ({ ...q, description: t }));

        const slice = t.slice(0, pos);
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
        const next = `${before}@${username}${after}`;
        setNewQuery((q) => ({ ...q, description: next }));
        clear();
        setTriggerStart(null);
        setHasTrigger(false);
        setOpenMention(false);
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                const newPos = (before + "@" + username).length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        });
    };


    const handleCreate = async () => {
        const { title, description, student, files } = newQuery;
        if (!title || !description || !student) {
            toast.message("Missing fields", { description: "Title and description are required." });
            return;
        }
        if (selectedTags.length === 0) {
            toast.message("Select tags", { description: "Pick at least one relevant tag." });
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const fd = new FormData();
            fd.append("student", student);
            fd.append("title", title);
            fd.append("description", description);
            selectedTags.forEach((t) => fd.append("tags", t)); // send as array
            (files || []).forEach((f) => fd.append("documents", f));

            const { data } = await api.post("/query/queries", fd, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setQueries((prev) => [data, ...(Array.isArray(prev) ? prev : [])]);
            setNewQuery({ title: "", description: "", student, files: [] });
            setSelectedTags([]);
            toast.success("Query created", { description: "Your query was submitted successfully." });
        } catch (err) {
            logAxiosError("handleCreate", err);
            const msg = err.response?.data?.message || err.message;
            toast.error("Create failed", { description: msg });
        } finally {
            setLoading(false);
        }
    };

    const filteredQueries =
        filterStatus === "all" ? queries : queries.filter((q) => q.status === filterStatus);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Queries</h1>

            {user?.role !== "faculty" && (
                <Card className="p-4 space-y-4">
                    <CardHeader>
                        <CardTitle>Create a new Query</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input
                            placeholder="Title"
                            value={newQuery.title}
                            onChange={(e) => setNewQuery({ ...newQuery, title: e.target.value })}
                        />

                        {/* Tags multi-select */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {selectedTags.map((t) => (
                                    <span key={t} className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground border">
                                        {t}
                                        <button
                                            type="button"
                                            className="ml-1 text-muted-foreground hover:text-foreground"
                                            onClick={() => removeTag(t)}
                                            aria-label={`Remove ${t}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <Popover open={openTags} onOpenChange={setOpenTags}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            {selectedTags.length ? "Edit tags" : "Select tags"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0" align="start" side="bottom">
                                        <Command>
                                            <CommandList className="max-h-60 overflow-auto">
                                                <CommandEmpty>No tags</CommandEmpty>
                                                <CommandGroup heading="Available">
                                                    {TAGS.map((t) => {
                                                        const active = selectedTags.includes(t);
                                                        return (
                                                            <CommandItem
                                                                key={t}
                                                                value={t}
                                                                onSelect={() => toggleTag(t)}
                                                                className="flex items-center justify-between"
                                                            >
                                                                <span className="capitalize">{t}</span>
                                                                <span
                                                                    className={`h-4 w-4 rounded border ${active ? "bg-primary border-primary" : "bg-transparent"}`}
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

                        {/* Description with mentions */}
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
                                        <CommandEmpty>{searching ? "Searching…" : "No matches"}</CommandEmpty>
                                        <CommandGroup heading="Users">
                                            {items.map((u) => (
                                                <CommandItem
                                                    key={u.id}
                                                    value={u.username}
                                                    onSelect={() => insertHandle(u.username)}
                                                    onPointerMove={(e) => e.preventDefault()}
                                                    onPointerLeave={(e) => e.preventDefault()}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="font-medium">@{u.username}</span>
                                                    <span className="text-xs text-muted-foreground">{u.name}</span>
                                                    <Badge variant="secondary" className="ml-auto uppercase text-[10px]">
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
                                setNewQuery({ ...newQuery, files: Array.from(e.target.files || []) })
                            }
                        />
                        <Button onClick={handleCreate} disabled={loading || searching || selectedTags.length === 0}>
                            {loading ? "Creating..." : "Create Query"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-2">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQueries.map((q) => (
                    <Link key={q._id} to={`/queries/${q._id}`}>
                        <Card className="space-y-2 cursor-pointer hover:shadow-lg transition">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {q.title}
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
                                <p className="overflow-hidden">{q.description}</p>
                                {Array.isArray(q.tags) && q.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {q.tags.map((t) => (
                                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {Array.isArray(q.mentions) && q.mentions.length > 0 && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Mentions: {q.mentions.map((m) => `@${m.username}`).join(", ")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
