import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, Profile } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NotifRow {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

const AdminNotifications = () => {
  const [rows, setRows] = useState<NotifRow[]>([]);
  const [recipients, setRecipients] = useState<Profile[]>([]);
  const [targetUser, setTargetUser] = useState("all-staff");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    const [notifRes, usersRes] = await Promise.all([
      supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").in("role", ["staff", "admin"]),
    ]);
    setRows((notifRes.data || []) as NotifRow[]);
    setRecipients((usersRes.data || []) as Profile[]);
  };

  useEffect(() => { fetchData(); }, []);

  const send = async () => {
    if (!title || !message) {
      toast.error("Title and message are required");
      return;
    }

    const targets = targetUser === "all-staff"
      ? recipients.filter((r) => r.role === "staff")
      : recipients.filter((r) => r.id === targetUser);

    if (!targets.length) {
      toast.error("No recipient selected");
      return;
    }

    const payload = targets.map((t) => ({
      user_id: t.id,
      title,
      message,
      type: "admin_alert",
      is_read: false,
    }));

    const { error } = await supabase.from("notifications").insert(payload as NotifRow[]);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Alert sent to ${targets.length} recipient(s)`);
    setTitle("");
    setMessage("");
    fetchData();
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Notifications System</h1>
          <p className="text-muted-foreground">Send alerts to staff and monitor admin notifications</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Send Alert</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={targetUser} onValueChange={setTargetUser}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-staff">All Staff</SelectItem>
                {recipients.map((r) => <SelectItem key={r.id} value={r.id}>{r.full_name} ({r.role})</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Alert title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Alert message" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button onClick={send}>Send Notification</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {rows.slice(0, 40).map((n) => (
              <div key={n.id} className="border rounded-md p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={n.is_read ? "outline" : "default"}>{n.is_read ? "Read" : "Unread"}</Badge>
                  {!n.is_read && <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>Mark Read</Button>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;
