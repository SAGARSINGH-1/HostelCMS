// src/pages/QueryDetail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";

const STATUS = ["pending", "in-progress", "resolved"];
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export default function QueryDetail() {
    const { id } = useParams();
    const { user } = useSelector((s) => s.auth);

    // be resilient if role isn't in slice but faculty users have designation
    const computedRole = user?.role || (user?.designation ? "faculty" : "student");
    const isFaculty = computedRole === "faculty";

    const [query, setQuery] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [note, setNote] = useState("");

    const fetchQuery = async () => {
        try {
            const { data } = await api.get(`/query/queries/${id}`);
            setQuery(data);
            setNewStatus(data?.status || "pending");
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error("Failed to load query", { description: msg });
            console.error("Failed to fetch query:", err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchQuery();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleUpdateStatus = async () => {
        if (!newStatus) return;
        try {
            setUpdating(true);
            await api.put(`/query/queries/${id}/status`, {
                status: newStatus,
                note,
                updatedBy: { id: user._id, name: user.name },
            });
            await fetchQuery();
            setNote("");
            toast.success("Status updated", { description: `Marked as ${newStatus}` });
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error("Update failed", { description: msg });
            console.error("Failed to update status:", err.response?.status, err.response?.data || err.message);
        } finally {
            setUpdating(false);
        }
    };

    const attachments = useMemo(
        () => (Array.isArray(query?.documents) ? query.documents : []),
        [query]
    );

    if (!query) return <p className="p-6">Loading...</p>;

    const statusPill =
        query.status === "pending"
            ? "bg-yellow-200 text-yellow-900"
            : query.status === "in-progress"
                ? "bg-blue-200 text-blue-900"
                : "bg-green-200 text-green-900";

    return (
        <div className="p-6 space-y-6">
            <Card className="space-y-4">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                                {query.student?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold break-words hyphens-auto">
                                    {query.student?.name || "Unknown"}
                                </span>
                                <span className="text-sm text-muted-foreground break-words hyphens-auto">
                                    {query.title}
                                </span>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusPill}`}>
                            {query.status}
                        </span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Details */}
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <p>{query.description}</p>
                            <br />
                            <p className="text-sm text-muted-foreground">Tags</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {(Array.isArray(query.tags) && query.tags.length ? query.tags : ["other"]).map((t) => (
                                    <span key={t} className="text-[13px] px-2 py-0.5 rounded-full border">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="mt-1 text-sm">
                                {query.createdAt ? new Date(query.createdAt).toLocaleString() : "-"}
                            </p>
                        </div>
                    </div>

                    {/* Faculty-only status update */}
                    {isFaculty && (
                        <div className="rounded-md border p-4 space-y-3">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Update status</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1000]">
                                            {STATUS.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={handleUpdateStatus}
                                        disabled={updating || newStatus === query.status}
                                    >
                                        {updating ? "Updating..." : "Save"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Optional note</label>
                                <Textarea
                                    rows={3}
                                    placeholder="Add a short note for the student (optional)"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            <h2 className="font-semibold">Attachments</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {attachments.map((doc, idx) => {
                                    const url = doc.gridId
                                        ? `${API_BASE}/api/files/${doc.gridId}`
                                        : doc.filePath
                                            ? `${API_BASE}/${doc.filePath}`
                                            : null;

                                    if (!url) {
                                        return (
                                            <div key={idx} className="text-sm text-muted-foreground break-words hyphens-auto">
                                                {doc.fileName || "Unknown file"}
                                            </div>
                                        );
                                    }

                                    if (doc.fileType?.startsWith("image/")) {
                                        return (
                                            <img
                                                key={idx}
                                                src={url}
                                                alt={doc.fileName}
                                                className="w-full rounded-lg shadow object-cover"
                                            />
                                        );
                                    }

                                    if (doc.fileType?.startsWith("video/")) {
                                        return (
                                            <video key={idx} controls className="w-full rounded-lg shadow">
                                                <source src={url} type={doc.fileType} />
                                            </video>
                                        );
                                    }

                                    return (
                                        <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary underline break-words hyphens-auto"
                                        >
                                            {doc.fileName || "Download file"}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Status history */}
                    {Array.isArray(query.statusHistory) && query.statusHistory.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="font-semibold">Status history</h2>
                            <ScrollArea className="max-h-56 pr-2">
                                <ul className="relative pl-4 space-y-3">
                                    <span className="absolute left-1 top-0 bottom-0 w-px bg-muted" />
                                    {query.statusHistory
                                        .slice()
                                        .reverse()
                                        .map((h, i) => (
                                            <li key={i} className="relative">
                                                <span className="absolute -left-[7px] top-2 size-3 rounded-full bg-primary" />
                                                <div className="ml-2 text-sm text-muted-foreground break-words hyphens-auto">
                                                    <span className="text-foreground">
                                                        {new Date(h.at).toLocaleString()}
                                                    </span>{" "}
                                                    — {h.from} → {h.to}
                                                    {h.note ? ` — ${h.note}` : ""}
                                                    {h.updatedBy?.name ? ` — by ${h.updatedBy.name}` : ""}
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            </ScrollArea>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
