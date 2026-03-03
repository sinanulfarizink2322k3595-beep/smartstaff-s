import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, Calendar, Shield, BarChart3, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StaffHub</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Multi-Tenant SaaS Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Modern Staff & Outpass{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Management System
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Streamline campus operations with digital outpass requests, meeting scheduling,
              and real-time staff availability tracking for educational institutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8 gap-2">
                  Join Your Organization
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
            <FeatureCard
              icon={<CheckCircle className="w-10 h-10 text-green-500" />}
              title="Digital Outpass"
              description="Request and track outpass approvals online. No more paper forms or waiting in queues."
            />
            <FeatureCard
              icon={<Calendar className="w-10 h-10 text-blue-500" />}
              title="Meeting Scheduler"
              description="Book appointments with tutors for consultations, notebook signing, and certificates."
            />
            <FeatureCard
              icon={<BarChart3 className="w-10 h-10 text-purple-500" />}
              title="Availability Tracking"
              description="View real-time staff availability to find the best time for your meetings."
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-red-500" />}
              title="Security Dashboard"
              description="Verify outpasses, track gate status, and handle emergency requests efficiently."
            />
            <FeatureCard
              icon={<GraduationCap className="w-10 h-10 text-indigo-500" />}
              title="Multi-tenancy"
              description="Each organization gets isolated workspaces with secure data separation."
            />
            <FeatureCard
              icon={<BarChart3 className="w-10 h-10 text-orange-500" />}
              title="Analytics"
              description="Comprehensive dashboards and insights for all roles with real-time data."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to join your organization?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sign up with your organization code to get started.
          </p>
          <Link href="/signup">
            <Button size="lg" className="px-8">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 StaffHub. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
