import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Globe, Mail, MapPin, Calendar as Cal, BookOpen, Star, Users } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const GITHUB_USERNAME = "SAGARSINGH-1"; // <-- replace with creator’s username
const DEV_USERNAME = "sagar_marc"; // optional: replace
const LINKEDIN_URL = "https://www.linkedin.com/in/sagar-singh-not-found/"; // replace
const WEBSITE_URL = "https://your-portfolio.example.com"; // optional
const EMAIL = "sagar.01ko@gmail.com"; // optional

const GH_API = "https://api.github.com";

export default function Creator() {
    const [user, setUser] = useState(null);
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch GitHub profile and pinned-like repos (using stars + recent activity heuristic)
    useEffect(() => {
        const load = async () => {
            try {
                const [uRes, rRes] = await Promise.all([
                    fetch(`${GH_API}/users/${GITHUB_USERNAME}`),
                    fetch(`${GH_API}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`),
                ]);
                const u = await uRes.json();
                const r = await rRes.json();

                setUser(u);
                // Heuristic highlight: top 6 by stargazers, then updated_at
                const top = (Array.isArray(r) ? r : [])
                    .sort((a, b) => {
                        if (b.stargazers_count !== a.stargazers_count) {
                            return b.stargazers_count - a.stargazers_count;
                        }
                        return new Date(b.updated_at) - new Date(a.updated_at);
                    })
                    .slice(0, 6);
                setRepos(top);
            } catch (e) {
                console.error("GitHub fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Avatar strategy: prefer user.avatar_url; fallback to github.com/<username>.png
    const avatarUrl = useMemo(() => {
        if (user?.avatar_url) return user.avatar_url;
        return `https://github.com/${GITHUB_USERNAME}.png?size=200`;
    }, [user]);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
            {/* Hero */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <Avatar className="h-24 w-24 ring-2 ring-primary/20">
                            <AvatarImage src={avatarUrl} alt={`${GITHUB_USERNAME} avatar`} />
                            <AvatarFallback>{(GITHUB_USERNAME[0] || "?").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {user?.name || GITHUB_USERNAME}
                            </h1>
                            <p className="text-muted-foreground">
                                {user?.bio || "Full‑stack developer crafting scalable apps and delightful UX."}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                {user?.location && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-4 w-4" /> {user.location}
                                    </span>
                                )}
                                {user?.created_at && (
                                    <span className="inline-flex items-center gap-1">
                                        <Cal className="h-4 w-4" /> Joined {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                )}
                                {typeof user?.followers === "number" && (
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-4 w-4" /> {user.followers} followers
                                    </span>
                                )}
                            </div>

                            {/* Socials */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button asChild variant="outline" size="sm" className="gap-2">
                                    <a href={user?.html_url || `https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noreferrer">
                                        <Github className="h-4 w-4" />
                                        GitHub
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="gap-2">
                                    <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                                        <Linkedin className="h-4 w-4" />
                                        LinkedIn
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="gap-2">
                                    <a href={`https://dev.to/${DEV_USERNAME}`} target="_blank" rel="noreferrer">
                                        <BookOpen className="h-4 w-4" />
                                        DEV
                                    </a>
                                </Button>
                                {WEBSITE_URL && (
                                    <Button asChild variant="outline" size="sm" className="gap-2">
                                        <a href={WEBSITE_URL} target="_blank" rel="noreferrer">
                                            <Globe className="h-4 w-4" />
                                            Website
                                        </a>
                                    </Button>
                                )}
                                {EMAIL && (
                                    <Button asChild variant="outline" size="sm" className="gap-2">
                                        <a href={`mailto:${EMAIL}`}>
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader><CardTitle>Repos</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{user?.public_repos ?? "—"}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Gists</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{user?.public_gists ?? "—"}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Followers</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{user?.followers ?? "—"}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Following</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{user?.following ?? "—"}</CardContent>
                </Card>
            </div>

            {/* Highlights */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Highlighted Projects</CardTitle>
                        <Button asChild variant="ghost" size="sm">
                            <a href={`${user?.html_url || `https://github.com/${GITHUB_USERNAME}`}?tab=repositories`} target="_blank" rel="noreferrer">
                                View all
                            </a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    {(repos || []).map((r) => (
                        <div key={r.id} className="rounded-lg border p-4 hover:bg-accent/30 transition">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <a
                                        href={r.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-lg font-semibold hover:underline"
                                    >
                                        {r.name}
                                    </a>
                                    {r.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {r.description}
                                        </p>
                                    )}
                                </div>
                                <Badge variant="secondary">{r.private ? "Private" : "Public"}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
                                <span className="inline-flex items-center gap-1">
                                    <Star className="h-4 w-4" />
                                    {r.stargazers_count}
                                </span>
                                {r.language && <span>{r.language}</span>}
                                {r.updated_at && (
                                    <span>Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && repos.length === 0 && (
                        <div className="text-sm text-muted-foreground">No repositories to highlight.</div>
                    )}
                </CardContent>
            </Card>

            {/* About section */}
            <Card>
                <CardHeader><CardTitle>About the Creator</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-muted-foreground">
                        Building robust web apps, APIs, and delightful user experiences. Passionate about performance, clean design systems, and developer tooling.
                    </p>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                        <Badge>JavaScript/TypeScript</Badge>
                        <Badge>React</Badge>
                        <Badge>Node.js</Badge>
                        <Badge>MongoDB</Badge>
                        <Badge>Tailwind + ShadCN</Badge>
                        <Badge>Recharts</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
