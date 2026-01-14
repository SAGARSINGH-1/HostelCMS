import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Shield, Cpu, LineChart, Layers, Cloud, BookOpen } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Mission */}
      <Card>
        <CardHeader>
          <CardTitle>Why this platform exists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This platform streamlines how campus issues are reported, tracked, and resolved. It replaces scattered emails and chats with a transparent workflow so students can raise concerns, faculty can prioritize, and administrators can measure outcomes.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Faster resolution through structured tickets and statuses.</li>
            <li>Fair visibility for every issue with tag-wise triage and analytics.</li>
            <li>A shared source of truth for students, faculty, and management.</li>
          </ul>
          <div className="pt-2">
            <Button asChild>
              <Link to="/creator">Meet the creator</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tech stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology we used</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>React</Badge>
            <Badge>Vite</Badge>
            <Badge>ShadCN UI</Badge>
            <Badge>Tailwind CSS</Badge>
            <Badge>Redux/Local State</Badge>
            <Badge>Node.js</Badge>
            <Badge>Express</Badge>
            <Badge>MongoDB + Mongoose</Badge>
            <Badge>JWT Auth</Badge>
            <Badge>Multer Uploads</Badge>
            <Badge>Recharts</Badge>
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Frontend
              </h3>
              <p className="text-sm text-muted-foreground">
                React with Vite delivers instant dev feedback and optimal builds. ShadCN UI and Tailwind provide an accessible, consistent design system, while Recharts powers visual analytics for tag-wise and status distributions.
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Component-driven UI with accessible primitives.</li>
                <li>Theme-friendly styles that match the rest of the app.</li>
                <li>Client-side filters for fast exploration.</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" /> Backend
              </h3>
              <p className="text-sm text-muted-foreground">
                Express APIs expose clean endpoints for creating, updating, and listing queries. MongoDB stores tickets, attachments, and status history, while Mongoose enforces data shape and validation.
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>JWT-secured endpoints and role-aware actions.</li>
                <li>Multer for multi-file uploads with safe storage paths.</li>
                <li>Aggregation pipelines for dashboard statistics.</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Cloud className="h-4 w-4" /> Reliability
              </h3>
              <p className="text-sm text-muted-foreground">
                CORS, input validation, and structured error handling keep the system robust. The API separates reads from writes and supports pagination to scale smoothly with usage.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <LineChart className="h-4 w-4" /> Insights
              </h3>
              <p className="text-sm text-muted-foreground">
                Tag and status breakdowns surface bottlenecks, while KPIs track pending, in‑progress, and resolved items. These insights help teams prioritize and improve turnaround times.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>How the workflow works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <ol className="list-decimal pl-6 space-y-2">
            <li>Students submit a ticket with title, description, tags, and optional files.</li>
            <li>Faculty triage by tags, update status, and add notes if needed.</li>
            <li>Dashboards aggregate data for transparency and accountability.</li>
          </ol>
          <p>
            The platform encourages small, frequent updates instead of long delays. Every status change keeps the reporter informed and maintains momentum.
          </p>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Community rules and guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" /> For everyone
            </h3>
            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mt-2">
              <li>Keep communication respectful and constructive.</li>
              <li>Share only relevant and accurate information.</li>
              <li>Do not post personal data beyond what is necessary.</li>
              <li>Use tags thoughtfully to help routing and analytics.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> For students
            </h3>
            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mt-2">
              <li>Search for existing tickets before creating a new one.</li>
              <li>Provide a clear title, concise description, and evidence if available.</li>
              <li>Choose the most accurate tag to help faculty triage.</li>
              <li>Check updates periodically and respond to faculty questions.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> For faculty
            </h3>
            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mt-2">
              <li>Prioritize safety and time-sensitive issues first.</li>
              <li>Update status promptly; small progress notes beat silence.</li>
              <li>Merge duplicates and link related tickets when possible.</li>
              <li>Use analytics to spot recurring problems and propose fixes.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Get involved */}
      <Card>
        <CardHeader>
          <CardTitle>Contribute and feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Ideas, pull requests, and issue reports are welcome. If something feels confusing or slow, please share feedback so it can be improved for everyone.
          </p>
          <Button asChild variant="outline">
            <a href="/creator">Contact the creator</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
