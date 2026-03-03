import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const KEY = "smartstaff_system_settings";

const defaultSettings = {
  workingStart: "09:00",
  workingEnd: "17:00",
  leavePolicy: "Staff should apply leave at least 1 day in advance.",
  outpassMaxHours: 4,
  outpassDailyLimit: 2,
};

const AdminSystemSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(settings));
    toast.success("System settings saved");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure working hours, leave policies, and outpass rules</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Working Hours Setup</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm mb-1">Start</p>
              <Input type="time" value={settings.workingStart} onChange={(e) => setSettings((s) => ({ ...s, workingStart: e.target.value }))} />
            </div>
            <div>
              <p className="text-sm mb-1">End</p>
              <Input type="time" value={settings.workingEnd} onChange={(e) => setSettings((s) => ({ ...s, workingEnd: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leave Policies</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={settings.leavePolicy} onChange={(e) => setSettings((s) => ({ ...s, leavePolicy: e.target.value }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Outpass Rules</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm mb-1">Max outpass time (hours)</p>
              <Input type="number" value={settings.outpassMaxHours} onChange={(e) => setSettings((s) => ({ ...s, outpassMaxHours: Number(e.target.value) }))} />
            </div>
            <div>
              <p className="text-sm mb-1">Daily outpass limit</p>
              <Input type="number" value={settings.outpassDailyLimit} onChange={(e) => setSettings((s) => ({ ...s, outpassDailyLimit: Number(e.target.value) }))} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={save}>Save Settings</Button>
      </div>
    </DashboardLayout>
  );
};

export default AdminSystemSettings;
