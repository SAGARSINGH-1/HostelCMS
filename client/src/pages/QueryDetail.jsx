// src/pages/QueryDetail.jsx
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
    ThumbsUp,
    ThumbsDown,
    LogIn,
    MapPin,
    CalendarDays,
    User2,
    Tags,
    ShieldAlert,
} from "lucide-react";
import api from "../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import CustomSelect from "../components/ui/CustomSelect";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";

const STATUS = ["pending", "in-progress", "resolved"];
const API_BASE =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

function getUserVote(votes, userId) {
    if (!userId) return null;
    if (votes?.upvotes?.some((id) => String(id) === String(userId))) return "upvote";
    if (votes?.downvotes?.some((id) => String(id) === String(userId))) return "downvote";
    return null;
}

function StatusBadge({ status }) {
    const styles =
        status === "pending"
            ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20"
            : status === "in-progress"
                ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                : "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";

    return (
        <Badge variant="outline" className={`capitalize ${styles}`}>
            {status || "pending"}
        </Badge>
    );
}

function DetailRow({ label, value }) {
    if (!value) return null;

    return (
        <div className="flex items-start justify-between gap-3 text-sm min-w-0">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="font-medium text-right break-words max-w-[65%]">{value}</span>
        </div>
    );
}

export default function QueryDetail() {
    const { id } = useParams();
    const { user, isAuthenticated } = useSelector((s) => s.auth);

    const computedRole = user?.role || (user?.designation ? "faculty" : "student");
    const isFaculty = computedRole === "faculty";

    const [query, setQuery] = useState(null);
    const [votes, setVotes] = useState({ upvotes: [], downvotes: [] });
    const [pageLoading, setPageLoading] = useState(true);
    const [voteLoading, setVoteLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [note, setNote] = useState("");

    const fetchQuery = useCallback(async () => {
        try {
            setPageLoading(true);

            const [queryRes, voteRes] = await Promise.all([
                api.get(`/query/queries/${id}`),
                api
                    .get(`/query/queries/${id}/viewvotes`)
                    .catch(() => ({ data: { votes: { upvotes: [], downvotes: [] } } })),
            ]);

            const queryData = queryRes?.data || null;
            const voteData = voteRes?.data?.votes || { upvotes: [], downvotes: [] };

            setQuery(queryData);
            setVotes(voteData);
            setNewStatus(queryData?.status || "pending");
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || "Failed to load query";
            toast.error("Failed to load query", { description: msg });
        } finally {
            setPageLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchQuery();
    }, [fetchQuery]);

    const handleUpdateStatus = async () => {
        if (!newStatus) return;

        try {
            setUpdating(true);

            await api.put(`/query/queries/${id}/status`, {
                status: newStatus,
                note,
                updatedBy: { id: user?._id, name: user?.name },
            });

            await fetchQuery();
            setNote("");
            toast.success("Status updated", {
                description: `Marked as ${newStatus}`,
            });
        } catch (err) {
            toast.error("Update failed", {
                description: err?.response?.data?.message || "Error updating",
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleVote = async (type) => {
        if (isFaculty) {
            toast.message("Voting unavailable", {
                description: "Faculty members cannot vote on complaints.",
            });
            return;
        }

        if (!isAuthenticated) {
            toast.message("Login required", {
                description: "Please login to upvote or downvote this complaint.",
            });
            return;
        }

        try {
            setVoteLoading(true);
            await api.post(`/query/queries/${id}/vote`, { type });
            await fetchQuery();

            toast.success(type === "upvote" ? "Upvoted" : "Downvoted", {
                description: `Your ${type} has been recorded.`,
            });
        } catch (err) {
            toast.error("Voting failed", {
                description: err?.response?.data?.message || "Unable to submit vote.",
            });
        } finally {
            setVoteLoading(false);
        }
    };

    const attachments = useMemo(
        () => (Array.isArray(query?.documents) ? query.documents : []),
        [query]
    );

    const upvoteCount = votes?.upvotes?.length || 0;
    const downvoteCount = votes?.downvotes?.length || 0;
    const currentVote = getUserVote(votes, user?._id);

    if (pageLoading) {
        return (
            <div className="p-6 text-sm text-muted-foreground">
                Loading complaint details...
            </div>
        );
    }

    if (!query) {
        return (
            <div className="p-6 text-sm text-muted-foreground">
                Complaint not found.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6 overflow-x-hidden">
            <Card className="overflow-hidden">
                <CardHeader className="space-y-4 border-b bg-muted/20">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between min-w-0">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                {query?.student?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>

                            <div className="min-w-0">
                                <CardTitle className="text-xl break-words leading-tight">
                                    {query?.title}
                                </CardTitle>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground min-w-0">
                                    <span className="inline-flex items-center gap-1 break-words">
                                        <User2 className="h-4 w-4 shrink-0" />
                                        <span className="break-words">
                                            Reported by {query?.student?.name || "Unknown"}
                                        </span>
                                    </span>

                                    <Separator orientation="vertical" className="h-4 hidden sm:block" />

                                    <span className="inline-flex items-center gap-1 break-words">
                                        <CalendarDays className="h-4 w-4 shrink-0" />
                                        <span className="break-words">
                                            {query?.createdAt
                                                ? new Date(query.createdAt).toLocaleString()
                                                : "Unknown date"}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <StatusBadge status={query?.status} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 p-4 md:p-6">
                    <div className="grid gap-6 md:grid-cols-[1.35fr_0.85fr] min-w-0">
                        <div className="space-y-5 min-w-0">

                            <div className="space-y-5 min-w-0">
                                {/* ASSIGNED FACULTY SECTION ADDED */}
                                <div className="rounded-xl border bg-muted/20 p-4 space-y-3 min-w-0">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                                        <User2 className="h-4 w-4" />
                                        Assigned Faculty
                                    </h3>
                                    <div className="text-sm">
                                        {query?.assignedTo && typeof query.assignedTo === 'object' ? (
                                            <p className="font-medium text-foreground">{query.assignedTo.name || "Assigned"}</p>
                                        ) : (
                                            <p className="text-muted-foreground italic">Unassigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>  

                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-muted-foreground">
                                    Description
                                </h3>
                                <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap">
                                    {query?.description || "No description provided."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 min-w-0">
                                <Badge variant="outline" className="capitalize">
                                    {query?.priority || "low"} priority
                                </Badge>

                                <Badge variant="secondary" className="capitalize">
                                    {query?.supportCount || 1} supporters
                                </Badge>

                                {(query?.tags || []).map((tag) => (
                                    <Badge key={tag} variant="outline" className="break-all">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            <div className="rounded-xl border p-4 space-y-4 min-w-0">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold">Community feedback</h3>
                                        <p className="text-sm text-muted-foreground break-words">
                                            Students can vote to show whether this issue needs more attention.
                                        </p>
                                    </div>

                                    {!isAuthenticated && !isFaculty ? (
                                        <Link to="/login" className="shrink-0">
                                            <Button variant="outline" size="sm">
                                                <LogIn className="mr-2 h-4 w-4" />
                                                Login to vote
                                            </Button>
                                        </Link>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 min-w-0">
                                    <Button
                                        type="button"
                                        variant={currentVote === "upvote" ? "default" : "outline"}
                                        disabled={voteLoading || isFaculty}
                                        onClick={() => handleVote("upvote")}
                                        className="min-w-[120px]"
                                    >
                                        <ThumbsUp className="mr-2 h-4 w-4" />
                                        Upvote ({upvoteCount})
                                    </Button>

                                    <Button
                                        type="button"
                                        variant={currentVote === "downvote" ? "destructive" : "outline"}
                                        disabled={voteLoading || isFaculty}
                                        onClick={() => handleVote("downvote")}
                                        className="min-w-[130px]"
                                    >
                                        <ThumbsDown className="mr-2 h-4 w-4" />
                                        Downvote ({downvoteCount})
                                    </Button>

                                    <Badge variant="secondary">Score: {upvoteCount - downvoteCount}</Badge>

                                    {isFaculty ? (
                                        <Badge variant="outline">Faculty cannot vote</Badge>
                                    ) : null}
                                </div>

                            </div>

                            {query?.statusHistory?.length > 0 && (
                                <div className="space-y-2 min-w-0">
                                    <h3 className="font-semibold">History</h3>
                                    <ScrollArea className="h-52 rounded-md border overflow-y-scroll">
                                        <div className="p-4 space-y-3 min-w-0">
                                            {query.statusHistory
                                                .slice()
                                                .reverse()
                                                .map((h, i) => (
                                                    <div
                                                        key={i}
                                                        className="text-sm rounded-md border p-3 bg-muted/20 min-w-0"
                                                    >
                                                        <p className="font-medium break-words">
                                                            {h?.at ? new Date(h.at).toLocaleString() : "Unknown time"}
                                                        </p>
                                                        <p className="text-muted-foreground break-words whitespace-pre-wrap leading-6">
                                                            Changed to{" "}
                                                            <span className="capitalize text-foreground font-medium">
                                                                {h?.to || "pending"}
                                                            </span>
                                                            {h?.note ? ` — ${h.note}` : ""}
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            {attachments.length > 0 && (
                                <div className="space-y-3 min-w-0">
                                    <h3 className="font-semibold">Attachments</h3>
                                    <div className="grid gap-3 sm:grid-cols-2 min-w-0">
                                        {attachments.map((doc, index) => {
                                            const src =
                                                typeof doc === "string"
                                                    ? doc.startsWith("http")
                                                        ? doc
                                                        : `${API_BASE}/${doc.replace(/^\/+/, "")}`
                                                    : doc?.url ||
                                                    (doc?.path
                                                        ? doc.path.startsWith("http")
                                                            ? doc.path
                                                            : `${API_BASE}/${String(doc.path).replace(/^\/+/, "")}`
                                                        : "");

                                            if (!src) return null;

                                            const name =
                                                typeof doc === "string"
                                                    ? `Attachment ${index + 1}`
                                                    : doc?.originalname || doc?.name || `Attachment ${index + 1}`;

                                            const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(src);

                                            return (
                                                <a
                                                    key={index}
                                                    href={src}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border p-3 hover:bg-muted/40 transition min-w-0 overflow-hidden"
                                                >
                                                    {isImage ? (
                                                        <img
                                                            src={src}
                                                            alt={name}
                                                            className="mb-3 h-40 w-full rounded-md object-cover"
                                                        />
                                                    ) : null}
                                                    <p className="truncate text-sm font-medium">{name}</p>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>


                        <div className="space-y-5 min-w-0">
                            <div className="rounded-xl border bg-muted/20 p-4 space-y-3 min-w-0">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <MapPin className="h-4 w-4" />
                                    Location details
                                </h3>

                                <div className="space-y-2 min-w-0">
                                    <DetailRow label="Campus" value={query?.campus} />
                                    <DetailRow
                                        label="Hostel"
                                        value={
                                            typeof query?.hostel === "object"
                                                ? query?.hostel?.name
                                                : query?.hostel
                                        }
                                    />
                                    <DetailRow label="Block" value={query?.block} />
                                    <DetailRow label="Floor" value={query?.floor} />
                                    <DetailRow label="Room" value={query?.roomNumber} />
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/20 p-4 space-y-3 min-w-0">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <Tags className="h-4 w-4" />
                                    Complaint summary
                                </h3>

                                <div className="space-y-2 min-w-0">
                                    <DetailRow label="Priority" value={query?.priority || "low"} />
                                    <DetailRow label="Supporters" value={String(query?.supportCount || 1)} />
                                    <DetailRow label="Upvotes" value={String(upvoteCount)} />
                                    <DetailRow label="Downvotes" value={String(downvoteCount)} />
                                </div>
                            </div>

                            {isFaculty && (
                                <div className="rounded-xl border bg-accent/10 p-4 space-y-4 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4" />
                                        <h3 className="font-semibold">Faculty actions</h3>
                                    </div>

                                    <CustomSelect
                                        value={newStatus}
                                        onChange={setNewStatus}
                                        options={STATUS}
                                        placeholder="Change status"
                                    />

                                    <Textarea
                                        placeholder="Add update note..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="resize-none"
                                    />

                                    <Button
                                        onClick={handleUpdateStatus}
                                        disabled={updating}
                                        className="w-full"
                                    >
                                        {updating ? "Saving..." : "Save status"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}