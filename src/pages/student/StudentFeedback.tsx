import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  Lightbulb,
} from "lucide-react";

const feedbackCategories = [
  { value: "bug", label: "Report Issue/Bug", icon: AlertCircle },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
  { value: "feedback", label: "General Feedback", icon: MessageSquare },
  { value: "other", label: "Other", icon: FileText },
];

const StudentFeedback = () => {
  const { profile } = useAuth();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        student_id: profile?.id,
        category,
        subject,
        message,
        contact_info: contact,
        status: "new",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSubmitted(true);
      setCategory("");
      setSubject("");
      setMessage("");
      setContact("");

      toast.success("Thank you! Your feedback has been submitted.");

      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Send Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Help us improve by sharing your thoughts, suggestions, or reporting issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-card">
              <CardContent className="p-6">
                {submitted ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Thank You!
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      Your feedback has been submitted successfully. We'll review
                      it and use it to improve our platform.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Feedback Category <span className="text-destructive">*</span>
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {feedbackCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Subject <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your feedback..."
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {subject.length}/100 characters
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Message <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Provide detailed feedback, including steps to reproduce if reporting a bug..."
                        rows={6}
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.length}/2000 characters
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Contact Information (Optional)
                      </Label>
                      <Input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Email or phone if you'd like us to follow up"
                        type="text"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        We'll only use this to contact you about your feedback
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="gradient-primary text-primary-foreground w-full gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            {/* Tips Card */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  Tips for Good Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-sm mb-1">Be Specific</p>
                  <p className="text-xs text-muted-foreground">
                    Describe exactly what you're experiencing or suggesting
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-semibold text-sm mb-1">Include Steps</p>
                  <p className="text-xs text-muted-foreground">
                    For bugs, list steps to reproduce the issue
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-semibold text-sm mb-1">Be Constructive</p>
                  <p className="text-xs text-muted-foreground">
                    Suggest improvements in a positive tone
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Categories Card */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {feedbackCategories.map((cat) => (
                  <div
                    key={cat.value}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setCategory(cat.value)}
                  >
                    <cat.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{cat.label}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Response Time Card */}
            <Card className="border-0 shadow-card bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">
                      We Value Your Input
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All feedback is reviewed by our team and helps us create
                      a better experience for you
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm mb-2">
                Will I receive a response to my feedback?
              </h4>
              <p className="text-sm text-muted-foreground">
                We review all feedback carefully. If you provide contact
                information and your feedback requires a response, our team
                will get back to you.
              </p>
            </div>
            <div className="border-t pt-6">
              <h4 className="font-semibold text-sm mb-2">
                How can I report a security issue?
              </h4>
              <p className="text-sm text-muted-foreground">
                For security concerns, please select "Report Issue/Bug" and
                provide detailed information. We take security seriously and
                will investigate promptly.
              </p>
            </div>
            <div className="border-t pt-6">
              <h4 className="font-semibold text-sm mb-2">
                Can I track my feedback?
              </h4>
              <p className="text-sm text-muted-foreground">
                Provide your contact information so we can follow up on your
                feedback. Check your email for any responses from our team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentFeedback;
