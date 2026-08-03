// src/pages/Profile.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import api from "../lib/api";

function getQueryId(value) {
    if (!value) return null;
    if (typeof value === "object") return value?._id || null;
    return value;
}

function formatDate(value) {
    if (!value) return "N/A";
    return new Date(value).toLocaleString();
}

function isUnread(item) {
    return !item?.readAt;
}

function ProfileField({ label, value }) {
    return (
        <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="text-sm font-medium break-words">{value || "N/A"}</p>
        </div>
    );
}

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-xl border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            {hint ? (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function NotificationCard({
    item,
    label,
    onMarkRead,
    loading,
}) {
    const unread = isUnread(item);
    const queryId = getQueryId(item?.queryId);
    const title = item?.payload?.title || "Untitled";
    const snippet =
        item?.payload?.snippet ||
        item?.payload?.message ||
        "No additional details available.";

    return (
        <li
            className={`rounded-xl border p-4 transition ${unread ? "border-primary/30 bg-primary/5" : "bg-background"
                }`}
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={unread ? "default" : "secondary"}>
                            {label}
                        </Badge>
                        {unread ? <Badge variant="outline">Unread</Badge> : null}
                    </div>

                    <p className="mt-3 text-sm font-semibold break-words">
                        {title}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground break-words line-clamp-2">
                        {snippet}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {item?.payload?.username ? (
                            <>
                                <span>@{item.payload.username}</span>
                                <Separator orientation="vertical" className="h-3" />
                            </>
                        ) : null}
                        <span>{formatDate(item?.createdAt)}</span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {queryId ? (
                        <Link to={`/queries/${queryId}`}>
                            <Button size="sm">Open</Button>
                        </Link>
                    ) : (
                        <Button size="sm" disabled>
                            Open
                        </Button>
                    )}

                    {unread ? (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={loading}
                            onClick={() => onMarkRead(item._id)}
                        >
                            {loading ? "..." : "Mark read"}
                        </Button>
                    ) : null}
                </div>
            </div>
        </li>
    );
}

export default function Profile() {
    const navigate = useNavigate();
    const { user, isAuthenticated, role: authRole } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(false);
    const [mentions, setMentions] = useState([]);
    const [assigned, setAssigned] = useState([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("mentions");
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [itemLoadingId, setItemLoadingId] = useState("");
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) navigate("/login");
    }, [isAuthenticated, navigate]);

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);

            const [mRes, aRes] = await Promise.all([
                api.get("/notifications/mention"),
                api.get("/notifications/assigned"),
            ]);

            setMentions(Array.isArray(mRes.data) ? mRes.data : []);
            setAssigned(Array.isArray(aRes.data) ? aRes.data : []);
        } catch (error) {
            console.error("notifications error:", error?.response?.data || error.message);
            toast.error("Failed to load notifications", {
                description: error?.response?.data?.message || error.message,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) loadNotifications();
    }, [isAuthenticated, loadNotifications]);

    if (!isAuthenticated) return null;

    const role = authRole || user?.role;
    const isFaculty = role === "faculty";
    const username =
        user?.username ||
        (user?.email ? user.email.split("@")[0].toLowerCase() : "");

    const unreadMentions = useMemo(
        () => mentions.filter((item) => !item.readAt).length,
        [mentions]
    );

    const unreadAssigned = useMemo(
        () => assigned.filter((item) => !item.readAt).length,
        [assigned]
    );

    const unreadTotal = unreadMentions + unreadAssigned;

    const applyFilters = useCallback(
        (items) => {
            let next = Array.isArray(items) ? items : [];

            if (unreadOnly) {
                next = next.filter((item) => !item.readAt);
            }

            if (search.trim()) {
                const q = search.toLowerCase();
                next = next.filter((item) => {
                    const haystack = [
                        item?.payload?.title,
                        item?.payload?.snippet,
                        item?.payload?.message,
                        item?.payload?.username,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return haystack.includes(q);
                });
            }

            return next;
        },
        [search, unreadOnly]
    );

    const filteredMentions = useMemo(
        () => applyFilters(mentions),
        [mentions, applyFilters]
    );

    const filteredAssigned = useMemo(
        () => applyFilters(assigned),
        [assigned, applyFilters]
    );

    const handleMarkRead = async (notificationId) => {
        try {
            setItemLoadingId(notificationId);
            await api.post(`/notifications/${notificationId}/read`);

            const markItem = (list) =>
                list.map((item) =>
                    item._id === notificationId
                        ? {
                            ...item,
                            readAt: item.readAt || new Date().toISOString(),
                        }
                        : item
                );

            setMentions((prev) => markItem(prev));
            setAssigned((prev) => markItem(prev));
        } catch (error) {
            toast.error("Failed to mark as read", {
                description: error?.response?.data?.message || error.message,
            });
        } finally {
            setItemLoadingId("");
        }
    };

    const handleMarkAllRead = async () => {
        const source = activeTab === "mentions" ? filteredMentions : filteredAssigned;
        const unreadItems = source.filter((item) => !item.readAt);

        if (!unreadItems.length) {
            toast.message("No unread items", {
                description: "Everything in this tab is already read.",
            });
            return;
        }

        try {
            setMarkingAll(true);

            await Promise.all(
                unreadItems.map((item) => api.post(`/notifications/${item._id}/read`))
            );

            const stamp = new Date().toISOString();
            const ids = new Set(unreadItems.map((item) => item._id));

            const markList = (list) =>
                list.map((item) =>
                    ids.has(item._id)
                        ? { ...item, readAt: item.readAt || stamp }
                        : item
                );

            if (activeTab === "mentions") {
                setMentions((prev) => markList(prev));
            } else {
                setAssigned((prev) => markList(prev));
            }

            toast.success("Updated", {
                description: "Unread notifications in this tab were marked as read.",
            });
        } catch (error) {
            toast.error("Bulk update failed", {
                description: error?.response?.data?.message || error.message,
            });
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-muted/60 to-muted/20 px-6 py-6 border-b">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <Avatar className="h-20 w-20 border shadow-sm">
                                    {user?.avatarUrl ? (
                                        <AvatarImage src={user.avatarUrl} alt={user?.name} />
                                    ) : (
                                        <AvatarFallback className="text-lg font-bold w-full">
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <div className="min-w-0">
                                    <h1 className="text-2xl font-bold truncate">
                                        {user?.name || "User"}
                                    </h1>

                                    {username ? (
                                        <p className="text-sm text-muted-foreground truncate">
                                            @{username}
                                        </p>
                                    ) : null}

                                    <p className="text-sm text-muted-foreground truncate">
                                        {user?.email || "No email"}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="secondary">
                                            {isFaculty ? "Faculty" : "Student"}
                                        </Badge>
                                        <Badge variant="outline">
                                            {unreadTotal} unread notifications
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={loadNotifications}>
                                    Refresh
                                </Button>
                                <Button onClick={handleMarkAllRead} disabled={markingAll}>
                                    {markingAll ? "Updating..." : "Mark tab as read"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Total mentions"
                                value={mentions.length}
                                hint={`${unreadMentions} unread`}
                            />
                            <StatCard
                                label="Assigned updates"
                                value={assigned.length}
                                hint={`${unreadAssigned} unread`}
                            />
                            <StatCard
                                label="Member since"
                                value={
                                    user?.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString()
                                        : "N/A"
                                }
                            />
                            <StatCard
                                label="Role"
                                value={isFaculty ? "Faculty" : "Student"}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Account details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <ProfileField label="Full name" value={user?.name} />
                                    <ProfileField label="Username" value={username ? `@${username}` : "N/A"} />
                                    <ProfileField label="Email" value={user?.email} />
                                    <ProfileField
                                        label="Joined on"
                                        value={
                                            user?.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString()
                                                : "N/A"
                                        }
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        {isFaculty ? "Work details" : "Residence details"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {isFaculty ? (
                                        <>
                                            <ProfileField
                                                label="Department"
                                                value={user?.department}
                                            />
                                            <ProfileField
                                                label="Designation"
                                                value={user?.designation}
                                            />
                                            <ProfileField
                                                label="Phone"
                                                value={user?.phone}
                                            />
                                            <div className="space-y-1 sm:col-span-2">
                                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                    Categories
                                                </p>
                                                {Array.isArray(user?.categories) &&
                                                    user.categories.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.categories.map((cat, idx) => (
                                                            <Badge key={`${cat}-${idx}`}>
                                                                {cat}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium">
                                                        No categories
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ProfileField
                                                label="Hostel"
                                                value={user?.hostel}
                                            />
                                            <ProfileField
                                                label="Room No"
                                                value={user?.roomNo}
                                            />
                                            <ProfileField
                                                label="Category"
                                                value={user?.category}
                                            />
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <CardTitle>Notifications</CardTitle>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                placeholder="Search title, snippet, username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-72"
                            />
                            <Button
                                variant={unreadOnly ? "default" : "outline"}
                                onClick={() => setUnreadOnly((prev) => !prev)}
                            >
                                {unreadOnly ? "Showing unread" : "Unread only"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2 md:w-[320px]">
                            <TabsTrigger value="mentions" className="cursor-pointer">
                                Mentions
                                {unreadMentions > 0 ? (
                                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                                        {unreadMentions}
                                    </span>
                                ) : null}
                            </TabsTrigger>

                            <TabsTrigger value="assigned" className="cursor-pointer">
                                Assigned
                                {unreadAssigned > 0 ? (
                                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                                        {unreadAssigned}
                                    </span>
                                ) : null}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="mentions" className="mt-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                </div>
                            ) : filteredMentions.length === 0 ? (
                                <EmptyState
                                    title="No mentions found"
                                    description="Try changing the search or unread filter."
                                />
                            ) : (
                                <ScrollArea className="max-h-[460px] pr-2">
                                    <ul className="space-y-3">
                                        {filteredMentions.map((item) => (
                                            <NotificationCard
                                                key={item._id}
                                                item={item}
                                                label="Mention"
                                                loading={itemLoadingId === item._id}
                                                onMarkRead={handleMarkRead}
                                            />
                                        ))}
                                    </ul>
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="assigned" className="mt-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                </div>
                            ) : filteredAssigned.length === 0 ? (
                                <EmptyState
                                    title="No assigned updates found"
                                    description="Assigned or status notifications will appear here."
                                />
                            ) : (
                                <ScrollArea className="max-h-[460px] pr-2">
                                    <ul className="space-y-3">
                                        {filteredAssigned.map((item) => (
                                            <NotificationCard
                                                key={item._id}
                                                item={item}
                                                label="Assigned"
                                                loading={itemLoadingId === item._id}
                                                onMarkRead={handleMarkRead}
                                            />
                                        ))}
                                    </ul>
                                </ScrollArea>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}