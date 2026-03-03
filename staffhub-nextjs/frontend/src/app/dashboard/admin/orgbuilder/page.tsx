"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orgBuilderApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Building2,
  Users,
  Shield,
  Briefcase,
  Check,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Eye,
  Loader2,
  Clock3
} from "lucide-react";

interface Department {
  id?: string;
  name: string;
  description: string;
  level: number;
  color?: string;
  icon?: string;
  children?: Department[];
}

interface Role {
  id?: string;
  name: string;
  description: string;
  level: number;
  departmentName?: string;
  permissions: { resource: string; action: string }[];
}

interface OrgStructure {
  organizationName: string;
  description: string;
  departments: Department[];
  roles: Role[];
}

const EXAMPLE_PROMPTS = [
  "Create a school system with departments and faculty roles",
  "Create an IT company structure with engineering and product teams",
  "Create a hospital management system with medical departments",
  "Create a university with multiple colleges and departments",
  "Create a startup with engineering, sales, and operations teams",
];

export default function OrganizationBuilderPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedStructure, setGeneratedStructure] = useState<OrgStructure | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  // Generate structure mutation
  const generateMutation = useMutation({
    mutationFn: (prompt: string) => orgBuilderApi.generate(prompt),
    onSuccess: (response) => {
      setGeneratedStructure(response.data.structure);
      toast({
        title: "Structure generated!",
        description: "Your organization structure has been created by AI",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.response?.data?.error || "Failed to generate structure",
        variant: "destructive",
      });
    },
  });

  // Apply structure mutation
  const applyMutation = useMutation({
    mutationFn: (structure: OrgStructure) => orgBuilderApi.apply(structure),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Organization structure has been applied to your database",
      });
      structureQuery.refetch();
      setGeneratedStructure(null);
    },
    onError: (error: any) => {
      toast({
        title: "Apply failed",
        description: error.response?.data?.error || "Failed to apply structure",
        variant: "destructive",
      });
    },
  });

  // Get current structure
  const structureQuery = useQuery({
    queryKey: ["orgStructure"],
    queryFn: async () => {
      const response = await orgBuilderApi.getStructure();
      return response.data;
    },
  });

  // Clear structure mutation
  const clearMutation = useMutation({
    mutationFn: () => orgBuilderApi.clear(),
    onSuccess: () => {
      toast({
        title: "Cleared",
        description: "Organization structure has been cleared",
      });
      structureQuery.refetch();
    },
  });

  const undoMutation = useMutation({
    mutationFn: () => orgBuilderApi.undo(),
    onSuccess: () => {
      toast({
        title: "Undo successful",
        description: "Previous organization structure has been restored",
      });
      structureQuery.refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Undo failed",
        description: error.response?.data?.error || "No previous applied structure to undo",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description of your organization",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(prompt);
  };

  const handleApply = () => {
    if (!generatedStructure) return;
    applyMutation.mutate(generatedStructure);
  };

  const toggleDepartment = (deptName: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptName)) {
        next.delete(deptName);
      } else {
        next.add(deptName);
      }
      return next;
    });
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  };

  const renderDepartmentTree = (dept: Department, level: number = 0) => {
    const isExpanded = expandedDepts.has(dept.name);
    const hasChildren = dept.children && dept.children.length > 0;

    return (
      <div key={dept.name} className="mb-2">
        <div
          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
          style={{ marginLeft: `${level * 24}px`, borderLeftColor: dept.color || "#3B82F6" }}
          onClick={() => hasChildren && toggleDepartment(dept.name)}
        >
          {hasChildren && (
            <button className="p-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: dept.color || "#3B82F6" }}
          >
            <Building2 className="w-4 h-4 text-white" />
          </div>

          <div className="flex-1">
            <div className="font-medium">{dept.name}</div>
            <div className="text-xs text-muted-foreground">{dept.description}</div>
          </div>

          <div className="text-xs bg-muted px-2 py-1 rounded">
            Level {dept.level}
          </div>
        </div>

        {hasChildren && isExpanded && dept.children!.map((child) => renderDepartmentTree(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-primary" />
          AI Organization Builder
        </h1>
        <p className="text-muted-foreground">
          Use AI to generate a complete organization structure with departments, roles, and permissions
        </p>
      </div>

      {structureQuery.data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock3 className="w-4 h-4" />
              Apply / Undo Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">Last Applied At</p>
                <p className="font-medium">{formatDateTime(structureQuery.data.lastAppliedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Undo At</p>
                <p className="font-medium">{formatDateTime(structureQuery.data.lastUndoAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generator Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Structure with AI
          </CardTitle>
          <CardDescription>
            Describe your organization type and let AI create the structure for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Organization Description</Label>
            <Input
              id="prompt"
              placeholder="e.g., Create a university with engineering and arts departments"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Example Prompts:</Label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="text-xs px-3 py-1 rounded-full border hover:bg-accent transition-colors"
                  disabled={generateMutation.isPending}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !prompt.trim()}
            className="w-full gap-2"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Structure
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Structure Preview */}
      {generatedStructure && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{generatedStructure.organizationName}</CardTitle>
                <CardDescription>{generatedStructure.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedStructure(null)}
                  disabled={applyMutation.isPending}
                >
                  Discard
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                  className="gap-2"
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Apply to Database
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Departments */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Departments ({generatedStructure.departments.length})
              </h3>
              <div className="space-y-2">
                {generatedStructure.departments.map((dept) => renderDepartmentTree(dept))}
              </div>
            </div>

            {/* Roles */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Roles ({generatedStructure.roles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedStructure.roles.map((role) => (
                  <div key={role.name} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                        {role.departmentName && (
                          <div className="text-xs text-primary mt-1">
                            Department: {role.departmentName}
                          </div>
                        )}
                      </div>
                      <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Level {role.level}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.map((perm, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          {perm.resource}:{perm.action}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Structure */}
      {structureQuery.data && structureQuery.data.departments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Current Organization Structure
                </CardTitle>
                <CardDescription>
                  {structureQuery.data.stats.totalDepartments} departments, {structureQuery.data.stats.totalRoles} roles
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (confirm("Undo last apply and restore previous structure?")) {
                      undoMutation.mutate();
                    }
                  }}
                  disabled={undoMutation.isPending || !structureQuery.data?.hasUndoAvailable}
                >
                  {undoMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Undo Last Apply"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => structureQuery.refetch()}
                  disabled={structureQuery.isRefetching}
                >
                  <RefreshCw className={`w-4 h-4 ${structureQuery.isRefetching ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear the entire structure?")) {
                      clearMutation.mutate();
                    }
                  }}
                  disabled={clearMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Departments */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Departments</h3>
              <div className="space-y-2">
                {structureQuery.data.departments.map((dept: any) => renderDepartmentTree(dept))}
              </div>
            </div>

            {/* Roles */}
            {structureQuery.data.roles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {structureQuery.data.roles.map((role: any) => (
                    <div key={role.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{role.name}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                          {role.department && (
                            <div className="text-xs text-primary mt-1">
                              Department: {role.department.name}
                            </div>
                          )}
                        </div>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Level {role.level}
                        </div>
                      </div>
                      {role.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.permissions.map((perm: any) => (
                            <span key={perm.id} className="text-xs bg-muted px-2 py-1 rounded">
                              {perm.resource}:{perm.action}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {structureQuery.data && structureQuery.data.departments.length === 0 && !generatedStructure && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Structure Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Use the AI generator above to create your organization structure
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
