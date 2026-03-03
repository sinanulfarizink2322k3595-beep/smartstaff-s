"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organizationApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    logo: "",
    settings: "{}",
  });

  const orgQuery = useQuery({
    queryKey: ["admin-organization"],
    queryFn: async () => {
      const response = await organizationApi.get();
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => organizationApi.update(data),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Organization settings have been saved successfully.",
      });
      orgQuery.refetch();
    },
    onError: (error: unknown) => {
      const apiError = error as {response?: {data?: {error?: string}}};
      toast({
        title: "Error",
        description: apiError.response?.data?.error || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (orgQuery.data) {
      const org = orgQuery.data;
      setFormData({
        name: org.name || "",
        slug: org.slug || "",
        domain: org.domain || "",
        logo: org.logo || "",
        settings: typeof org.settings === "object" ? JSON.stringify(org.settings, null, 2) : org.settings || "{}",
      });
    }
  }, [orgQuery.data]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        slug: formData.slug,
        domain: formData.domain,
        logo: formData.logo,
      };

      try {
        payload.settings = JSON.parse(formData.settings);
      } catch (err) {
        toast({
          title: "Invalid JSON",
          description: "Settings must be valid JSON format",
          variant: "destructive",
        });
        return;
      }

      updateMutation.mutate(payload);
    } catch (error: unknown) {
      const err = error as {message?: string};
      toast({
        title: "Error",
        description: err.message || "Failed to prepare update",
        variant: "destructive",
      });
    }
  };

  if (orgQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your organization settings.</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading settings...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your organization settings.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="SmartStaff Nilgiri"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Organization Slug</Label>
                <Input
                  id="slug"
                  placeholder="nilgiri"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="nilgiri.edu"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings">Settings JSON</Label>
              <textarea
                id="settings"
                className="w-full h-48 p-3 rounded-md border border-input bg-background font-mono text-sm"
                placeholder='{\n  "key": "value"\n}'
                value={formData.settings}
                onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Enter configuration as valid JSON</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => orgQuery.refetch()}
            disabled={orgQuery.isLoading || updateMutation.isPending}
          >
            Reset
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
