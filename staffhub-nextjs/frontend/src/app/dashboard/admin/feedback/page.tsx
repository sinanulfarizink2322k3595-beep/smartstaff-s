"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { feedbackApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface Feedback {
  id: string;
  message: string;
  rating?: number | null;
  category: string;
  isAnonymous: boolean;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export default function AdminFeedbackPage() {
  const [responseById, setResponseById] = useState<Record<string, string>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const feedbackQuery = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const response = await feedbackApi.getAll();
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status: string; response?: string }) => {
      return feedbackApi.updateStatus(id, { status, response });
    },
    onSuccess: async () => {
      toast({ title: "Updated", description: "Feedback status updated successfully." });
      await feedbackQuery.refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.response?.data?.error || "Could not update feedback",
        variant: "destructive",
      });
    },
  });

  const feedbacks: Feedback[] = useMemo(() => {
    const payload = feedbackQuery.data;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }, [feedbackQuery.data]);

  const filteredFeedbacks = useMemo(() => {
    if (categoryFilter === "all") return feedbacks;
    return feedbacks.filter((f) => f.category === categoryFilter);
  }, [feedbacks, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(feedbacks.map((f) => f.category));
    return Array.from(cats);
  }, [feedbacks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Feedback</h1>
        <p className="text-muted-foreground">Review user feedback and ratings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedbacks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {feedbacks.length > 0
                ? (
                  feedbacks.filter((f) => f.rating).reduce((acc, f) => acc + (f.rating || 0), 0) /
                  feedbacks.filter((f) => f.rating).length
                ).toFixed(1)
                : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => feedbackQuery.refetch()}>
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {feedback.isAnonymous ? "Anonymous" : feedback.user?.fullName || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">{feedback.category}</div>
                    </div>
                    {feedback.rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < feedback.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{feedback.message}</p>
                  <div className="text-xs text-muted-foreground">
                    {new Date(feedback.createdAt).toLocaleString()}
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs">Admin Response</Label>
                    <Input
                      placeholder="Type your response..."
                      value={responseById[feedback.id] || ""}
                      onChange={(e) =>
                        setResponseById((prev) => ({ ...prev, [feedback.id]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: feedback.id,
                          status: "responded",
                          response: responseById[feedback.id],
                        })
                      }
                      disabled={updateStatusMutation.isPending || !responseById[feedback.id]}
                    >
                      Send Response
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredFeedbacks.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                {feedbackQuery.isLoading ? "Loading feedback..." : "No feedback found"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
