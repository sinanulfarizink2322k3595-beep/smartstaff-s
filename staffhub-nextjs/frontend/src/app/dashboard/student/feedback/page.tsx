"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { feedbackApi } from "@/lib/api";
import { format } from "date-fns";

type FeedbackStatus = "PENDING" | "REVIEWED" | "RESOLVED";
type FeedbackCategory = "GENERAL" | "TECHNICAL" | "SUGGESTION" | "COMPLAINT" | "APPRECIATION";

interface Feedback {
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  PENDING: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950", label: "Pending" },
  REVIEWED: { icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950", label: "Reviewed" },
  RESOLVED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950", label: "Resolved" },
};

const categoryOptions = [
  { value: "GENERAL", label: "General Feedback" },
  { value: "TECHNICAL", label: "Technical Issue" },
  { value: "SUGGESTION", label: "Suggestion" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "APPRECIATION", label: "Appreciation" },
];

export default function StudentFeedbackPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    category: "GENERAL",
    subject: "",
    message: "",
  });

  // Fetch feedback history
  const { data: feedbackList, isLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      const response = await feedbackApi.getAll();
      return response.data.feedback || response.data || [];
    },
  });

  // Submit feedback mutation
  const submitMutation = useMutation({
    mutationFn: (data: typeof formData) => feedbackApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setFormData({ category: "GENERAL", subject: "", message: "" });
      toast({
        title: "Success",
        description: "Your feedback has been submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(formData);
  };

  const getCategoryIcon = (category: FeedbackCategory) => {
    switch (category) {
      case "APPRECIATION":
        return <Star className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Feedback</h1>
        <p className="text-muted-foreground">Share your feedback, suggestions, and concerns with us.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit New Feedback</CardTitle>
            <CardDescription>
              Your feedback helps us improve. All submissions are reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief subject of your feedback"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your feedback in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific and detailed to help us understand your feedback better
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Feedback Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Be Specific</h4>
                  <p className="text-sm text-muted-foreground">
                    Provide clear details about your experience or suggestion
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Be Constructive</h4>
                  <p className="text-sm text-muted-foreground">
                    Focus on solutions and improvements rather than just problems
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Be Respectful</h4>
                  <p className="text-sm text-muted-foreground">
                    Maintain a professional and courteous tone
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">4</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Track Your Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    Check below to see responses to your previous submissions
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Response Time</p>
              <p className="text-sm text-muted-foreground">
                We typically review and respond to feedback within 2-3 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
          <CardDescription>
            View all your previous feedback submissions and responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading feedback history...</p>
          ) : feedbackList?.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No feedback submitted yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Submit your first feedback using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList?.map((feedback: Feedback) => {
                const config = statusConfig[feedback.status];
                const StatusIcon = config.icon;
                const category = categoryOptions.find(c => c.value === feedback.category);

                return (
                  <div key={feedback.id} className="border rounded-lg overflow-hidden">
                    <div className={`p-4 ${config.bg} border-b`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{feedback.subject}</h4>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/50 text-xs">
                              {getCategoryIcon(feedback.category)}
                              <span>{category?.label}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Submitted on {format(new Date(feedback.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                          <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Your Message:</p>
                        <p className="text-sm text-muted-foreground">{feedback.message}</p>
                      </div>

                      {feedback.response && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-sm font-medium text-primary mb-2">Response from Admin:</p>
                          <p className="text-sm">{feedback.response}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Responded on {format(new Date(feedback.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                        </div>
                      )}

                      {feedback.status === "PENDING" && (
                        <p className="text-xs text-muted-foreground italic">
                          Your feedback is being reviewed. You'll be notified when we respond.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
