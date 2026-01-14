// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import api from "../lib/api";

export default function Profile() {
    const navigate = useNavigate();
    const { user, isAuthenticated, role: authRole } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) navigate("/login");
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) return null;

    const role = authRole || (user?.designation ? "faculty" : "student");
    const isFaculty = role === "faculty";
    const username = user?.username || (user?.email ? user.email.split("@")[0].toLowerCase() : null);

    // Mentions/Notifications
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");

    const loadNotifications = async () => {
        try {
            // setLoading(true);
            const data = await api.get("/notifications");
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("[notifications] error:", e?.response?.status, e?.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        loadNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const mentionItems = useMemo(() => {
        const list = (items || []).filter((n) => n.type === "mention");
        if (!q.trim()) return list;
        const s = q.trim().toLowerCase();
        return list.filter((n) => {
            const t = `${n?.payload?.title || ""} ${n?.payload?.snippet || ""}`.toLowerCase();
            return t.includes(s);
        });
    }, [items, q]);

    const unreadCount = (items || []).filter((n) => !n.readAt).length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
            {/* Profile Card */}
            <Card>
                <CardHeader className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                        {user?.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user?.name} />
                        ) : (
                            <AvatarFallback>{user?.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                        )}
                    </Avatar>
                    <div className="min-w-0">
                        <CardTitle className="text-xl truncate">{user?.name}</CardTitle>
                        {username && (
                            <p className="text-sm text-muted-foreground truncate">@{username}</p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary">{isFaculty ? "Faculty" : "Student"}</Badge>
                            <Badge>{unreadCount} unread</Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">User ID</p>
                            <p className="font-medium break-words">{user?._id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p className="font-medium">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    </div>

                    <button onClick={loadNotifications}>load</button>

                    {!isFaculty && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Hostel</p>
                                <p className="font-medium">{user?.hostel || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Room No</p>
                                <p className="font-medium">{user?.roomNo || "N/A"}</p>
                            </div>
                        </div>
                    )}

                    {isFaculty && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Department</p>
                                <p className="font-medium">{user?.department || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Designation</p>
                                <p className="font-medium">{user?.designation || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{user?.phone || "N/A"}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mentions and Notifications */}
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Mentions</CardTitle>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search mentions..."
                            className="w-56"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <Button variant="outline" onClick={loadNotifications}>Refresh</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="mentions" className="w-full">
                        <TabsList>
                            <TabsTrigger value="mentions">Mentions</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>

                        <TabsContent value="mentions" className="mt-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            ) : mentionItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No mentions yet.</p>
                            ) : (
                                <ScrollArea className="max-h-[420px] pr-2">
                                    <ul className="space-y-3">
                                        {mentionItems.map((n) => (
                                            <li key={n._id} className="rounded-md border p-3 hover:bg-accent/50 transition">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            Mention in: {n?.payload?.title || "Untitled"}
                                                        </p>
                                                        {n?.payload?.snippet && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {n.payload.snippet}
                                                            </p>
                                                        )}
                                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>@{n?.payload?.username}</span>
                                                            <Separator orientation="vertical" className="h-3" />
                                                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                                                            {!n.readAt && <Badge variant="secondary">new</Badge>}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-2">
                                                        <Link to={`/queries/${n.queryId}`}>
                                                            <Button size="sm">Open</Button>
                                                        </Link>
                                                        {!n.readAt && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await api.post(`/notifications/${n._id}/read`);
                                                                    await loadNotifications();
                                                                }}
                                                            >
                                                                Mark read
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="all" className="mt-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            ) : (items || []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No notifications.</p>
                            ) : (
                                <ScrollArea className="max-h-[420px] pr-2">
                                    <ul className="space-y-3">
                                        {items.map((n) => (
                                            <li key={n._id} className="rounded-md border p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {n.type === "mention" ? "Mention" : "Status updated"}
                                                        </p>
                                                        {n?.payload?.title && (
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {n.payload.title}
                                                            </p>
                                                        )}
                                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                                                            {!n.readAt && <Badge variant="secondary">new</Badge>}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-2">
                                                        <Link to={`/queries/${n.queryId}`}>
                                                            <Button size="sm">Open</Button>
                                                        </Link>
                                                        {!n.readAt && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    await api.post(`/notifications/${n._id}/read`);
                                                                    await loadNotifications();
                                                                }}
                                                            >
                                                                Mark read
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
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
