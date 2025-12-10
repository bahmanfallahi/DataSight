'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DataSightLogo from '@/components/data-sight/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { BarChart, DollarSign, UserCheck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`
    bg-gray-800/30 backdrop-blur-lg border border-gray-200/10 rounded-2xl shadow-lg
    transition-all duration-300 hover:border-gray-200/20 hover:shadow-2xl
    ${className}
  `}>
    {children}
  </div>
);


export default function LandingPage() {
    const { setTheme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Force dark theme for this page
        setTheme('dark');
    }, [setTheme]);

    if (!isMounted) {
        return null; 
    }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white font-body overflow-x-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-background to-transparent"></div>
      </div>
      
      <header className="sticky top-0 z-50 w-full bg-transparent">
        <nav className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <DataSightLogo className="h-7 w-7 text-white" />
            <span className="text-xl font-bold tracking-tight text-white">DataSight</span>
          </Link>
          <div className="flex items-center gap-4">
             <div className="hidden md:block">
                 <ThemeToggle />
             </div>
            <Button asChild variant="outline" className="bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container relative z-10 mx-auto flex flex-col items-center justify-center px-4 text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter !leading-tight">
            Analyze as much as possible.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-400">
            Advanced analytics dashboard for monitoring sales, agents, and regional performance in real-time.
          </p>
          <Button asChild size="lg" className="mt-8 bg-primary/90 text-primary-foreground hover:bg-primary animate-pulse hover:animate-none shadow-[0_0_20px_hsl(var(--primary))]">
            <Link href="/login">Go to Dashboard</Link>
          </Button>

          <div className="relative mt-20 md:mt-24 w-full max-w-5xl">
            <div className="absolute -inset-20 bg-primary/10 blur-3xl rounded-full"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center relative">
              {/* Left Card */}
              <GlassCard className="p-6 md:col-span-1 transform -rotate-6 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <p className="text-sm text-gray-400">Total Sales</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <DollarSign className="h-6 w-6 text-green-400" />
                  <p className="text-3xl font-bold">[T] 1.2B</p>
                </div>
                <svg className="w-full h-16 mt-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 100 40">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 30 Q 15 10, 30 25 T 60 20 T 98 10" />
                </svg>
              </GlassCard>

              {/* Center Card */}
              <GlassCard className="p-6 md:col-span-1 transform scale-110 z-10 transition-transform duration-500 hover:scale-115">
                <p className="font-semibold text-center text-lg">Data Distribution</p>
                <p className="text-sm text-gray-400 text-center mb-4">Analyze value distribution</p>
                 <div className="w-full h-32 flex items-center justify-center">
                    <BarChart className="w-20 h-20 text-primary/70" strokeWidth={1.5} />
                 </div>
              </GlassCard>

              {/* Right Card */}
              <GlassCard className="p-6 md:col-span-1 transform rotate-6 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <p className="text-sm text-gray-400">Best Selling Agent</p>
                <div className="flex items-center gap-3 mt-2">
                    <UserCheck className="h-6 w-6 text-cyan-400" />
                    <p className="text-2xl font-bold">Agent X</p>
                </div>
                <p className="text-xs text-gray-500 mt-4">+15% sales this month</p>
              </GlassCard>
            </div>
          </div>

        </div>
      </main>
       <footer className="w-full py-6">
          <div className="container mx-auto flex h-24 items-center justify-center">
            <p className="text-xs text-muted-foreground">
              develop with ❤️ by bahman fallahi
            </p>
          </div>
      </footer>
    </div>
  );
}
