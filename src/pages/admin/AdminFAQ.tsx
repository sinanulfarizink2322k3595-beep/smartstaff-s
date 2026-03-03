import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const AdminFAQ = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions shown to users.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              FAQ Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            FAQ management page is ready. You can connect create/edit/delete FAQ actions here.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminFAQ;
