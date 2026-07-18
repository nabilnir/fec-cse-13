"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  BookOpen,
  Award,
  Users,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  Quote,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  BookMarked,
  Layers,
  FlaskConical,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// CountUp component to animate stats on scroll
function CountUp({ end, duration = 1.5 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const endValue = end;
    const totalFrames = duration * 60;
    const increment = endValue / totalFrames;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      start += increment;
      if (frame >= totalFrames) {
        setCount(endValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Parallax Scroll logic for Hero section
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], ["0%", "55%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* --- Sticky Glassmorphic Navbar --- */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          {/* Logo & College Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/90 p-1 shadow-md ring-1 ring-accent/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-accent/20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 via-transparent to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Image
                src="/Fec LOGO (1).png"
                alt="Faridpur Engineering College logo"
                width={48}
                height={48}
                className="relative h-full w-full rounded-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-primary leading-tight dark:text-foreground">
                Faridpur Engineering College
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Est. 2010 • Autonomous
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="#about" className="text-sm font-medium hover:text-accent transition-colors">
              About FEC
            </Link>
            <Link href="#programs" className="text-sm font-medium hover:text-accent transition-colors">
              Programs
            </Link>
            <Link href="#campus-life" className="text-sm font-medium hover:text-accent transition-colors">
              Campus Life
            </Link>
            <Link href="#stories" className="text-sm font-medium hover:text-accent transition-colors">
              Stories
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/notes">
              <Button
                variant="default"
                className="relative bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 shadow-md hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 hover:-translate-y-0.5 border border-accent-foreground/10 group overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <BookMarked className="w-4 h-4 animate-pulse" />
                  NOTES & QUESTIONS
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden flex items-center gap-4">
            <Link href="/notes">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-3">
                NOTES
              </Button>
            </Link>
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="text-primary" />}>
                <Menu className="w-6 h-6" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l border-border bg-background">
                <div className="flex flex-col gap-8 mt-12">
                  <Link href="#about" className="text-lg font-medium hover:text-accent transition-colors">
                    About FEC
                  </Link>
                  <Link href="#programs" className="text-lg font-medium hover:text-accent transition-colors">
                    Programs
                  </Link>
                  <Link href="#campus-life" className="text-lg font-medium hover:text-accent transition-colors">
                    Campus Life
                  </Link>
                  <Link href="#stories" className="text-lg font-medium hover:text-accent transition-colors">
                    Stories
                  </Link>
                  <div className="border-t border-border pt-6">
                    <Link href="/notes" className="w-full">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-2">
                        <BookMarked className="w-4 h-4" />
                        NOTES PLATFORM
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* --- Parallax Hero Section --- */}
      <section ref={heroRef} className="relative h-[90vh] md:h-[95vh] w-full flex items-center justify-center overflow-hidden bg-[#051c1a]">
        {/* Parallax Background Canvas */}
        <motion.div
          style={{ y: heroBgY, opacity: heroOpacity }}
          className="absolute inset-0 w-full h-full scale-105 pointer-events-none"
        >
          <Image
            src="/campus_hero.png"
            alt="Faridpur Engineering College Campus"
            fill
            priority
            className="object-cover object-center opacity-85"
          />
          {/* Subtle overlay gradients to blend the illustration */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#051c1a] via-transparent to-[#051c1a]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#051c1a]/40 via-transparent to-[#051c1a]/40" />
        </motion.div>

        {/* Floating Clouds/Particle Elements */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-64 h-16 bg-white/5 blur-2xl rounded-full animate-[pulse_6s_infinite]" />
          <div className="absolute top-[25%] right-[10%] w-96 h-24 bg-teal-500/5 blur-3xl rounded-full animate-[pulse_10s_infinite]" />
        </div>

        {/* Hero Content Overlay */}
        <motion.div
          style={{ y: heroTextY }}
          className="relative z-20 text-center max-w-4xl px-6 md:px-8 flex flex-col items-center gap-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-2 bg-accent/25 border border-accent/40 rounded-full px-4 py-1.5 text-xs md:text-sm font-semibold tracking-wide text-accent"
          >
            <Sparkles className="w-4 h-4" />
            EMPOWERING ENGINEERS OF TOMORROW
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg"
          >
            Innovate. Create. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-amber-200 to-accent">
              Lead the Future.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-md md:text-xl text-teal-50/90 font-medium max-w-2xl leading-relaxed drop-shadow"
          >
            At Faridpur Engineering College, we foster scientific curiosity, pioneering research, and real-world problem solving. Our students shape a better tomorrow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-4"
          >
            <Link href="#about">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 shadow-md">
                Learn More
              </Button>
            </Link>
            <Link href="/notes">
              <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                Get Student Notes
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50 text-xs">
          <span>Scroll Down</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full p-1 flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-1.5 h-2 bg-accent rounded-full"
            />
          </div>
        </div>
      </section>


      {/* --- Key Pillars (Cards from UI image) --- */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-[#E0F2F1]/80 hover:bg-[#E0F2F1] text-[#0A2522] border border-[#B2DFDB]/40 shadow-sm transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-800 mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-3 text-primary">Transformative Education</h3>
              <p className="text-sm leading-relaxed text-slate-700 mb-6">
                With a plan to impart knowledge across disciplines, we build a platform where learning meets hands-on projects, workshops, and guided mentorship.
              </p>
              <Link href="#programs" className="inline-flex items-center gap-1 text-sm font-bold text-teal-800 hover:text-teal-900 group">
                Future Curriculum
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-2xl bg-[#FDF6E3]/90 hover:bg-[#FDF6E3] text-[#4E3629] border border-[#F4E3C1]/50 shadow-sm transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-800 mb-6">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-3 text-[#4E3629]">Pioneering Research</h3>
              <p className="text-sm leading-relaxed text-amber-900/80 mb-6">
                Discover future technologies. Join faculty-led initiatives, publish journals, and patent breakthroughs in state-of-the-art incubation centres.
              </p>
              <Link href="#programs" className="inline-flex items-center gap-1 text-sm font-bold text-amber-800 hover:text-amber-900 group">
                Discover Research
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl bg-[#ECEFF1]/90 hover:bg-[#ECEFF1] text-[#263238] border border-[#CFD8DC]/50 shadow-sm transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-200/50 flex items-center justify-center text-slate-700 mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-3 text-slate-800">Global Impact & Engagement</h3>
              <p className="text-sm leading-relaxed text-slate-650 mb-6">
                Our students lead local projects with international impacts, building web portals, software utilities, and sustainable hardware systems.
              </p>
              <Link href="#programs" className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-slate-900 group">
                Learn More
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- About / Info Section --- */}
      <section id="about" className="py-20 md:py-28 bg-[#f3f6f5] scroll-mt-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Paragraphs and Headers */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <span className="text-accent text-sm md:text-base font-bold tracking-widest uppercase">
                Welcome to Felix College
              </span>
              <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-primary tracking-tight">
                Our Mission: Engineering a Sustainable & Smart Future
              </h2>
              <div className="h-1 w-16 bg-accent rounded-full" />
              
              <p className="text-base text-muted-foreground leading-relaxed">
                Founded in 2010, Faridpur Engineering College has stood as a vanguard of engineering excellence. Over more than a decade, we have evolved from a local technical institute into an internationally recognized autonomous research institution. Our focus is to produce thinking leaders capable of writing clean solutions for complex global issues.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Through rigorous academic instruction, collaborative projects, and industry alignment, we empower students to push boundaries. Our curriculum is tailored dynamically in consultation with technology giants and top-tier researchers, ensuring our graduates are ready to lead immediately.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                We believe that engineering is a creative art and a public responsibility. Hence, our students run open source hubs, contribute notes publicly, and design solutions that empower marginalized communities.
              </p>
            </div>

            {/* Grid of college photos (generated illustrations) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative group overflow-hidden rounded-2xl shadow-md border border-border/40 aspect-[4/3] sm:col-span-2">
                <Image
                  src="/campus_life.png"
                  alt="Student campus life illustration"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <span className="text-white text-md font-bold font-serif">Vibrant Student Life & Communities</span>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-2xl shadow-md border border-border/40 aspect-[4/3]">
                <Image
                  src="/campus_lab.png"
                  alt="Modern electronics laboratory"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-sm font-bold font-serif">Advanced Lab Equipment</span>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-2xl shadow-md border border-border/40 aspect-[4/3] bg-primary flex flex-col justify-between p-6">
                <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                <div>
                  <h4 className="text-white font-serif font-bold text-lg leading-tight mb-2">Award-Winning Academic Portal</h4>
                  <p className="text-xs text-teal-200">Our students collaborate globally to maintain free notes, journals, and questions banks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Study Programs (Layout and details from UI image) --- */}
      <section id="programs" className="py-20 md:py-28 bg-background scroll-mt-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold tracking-widest text-accent uppercase bg-accent/10 border border-accent/25 rounded-full px-4 py-1">
              ACADEMICS
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-primary tracking-tight mt-4 mb-4">
              Study Programs
            </h2>
            <p className="text-md text-muted-foreground max-w-2xl mx-auto">
              Focused undergraduate study designed to build strong engineering foundations for the future.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[230px] group transition-all"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-teal-800">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-primary group-hover:text-accent transition-colors">
                    Bachelors
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our comprehensive undergraduate engineering programs provide strong foundations in technology, innovation, and practical problem solving for future leaders.
                </p>
              </div>
              <Link href="#contact" className="inline-flex items-center gap-1 text-sm font-bold text-accent group-hover:text-primary transition-colors mt-6">
                Learn More
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Campus Life (Section from UI image) --- */}
      <section id="campus-life" className="py-20 md:py-24 bg-[#062a27] text-white scroll-mt-20 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-extrabold tracking-widest text-accent uppercase border-b-2 border-accent pb-1">
              COMMUNITY
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-extrabold tracking-tight mt-4 mb-6">
              Campus Life
            </h2>
            <p className="text-md text-teal-100/80 max-w-xl">
              Grow beyond classrooms through competitive events, sports activities, cultural festivals, and community groups.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Club Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between group hover:bg-white/10 transition-all duration-300"
            >
              <div>
                <span className="text-[10px] text-accent tracking-widest uppercase font-bold">Groups & Chapters</span>
                <h3 className="font-serif text-2xl font-bold mt-2 mb-4">Clubs and Organizations</h3>
                <p className="text-sm text-teal-100/70 leading-relaxed mb-6">
                  Join student-run clubs ranging from technical coders (FEC Open Source Club, AI Guild) to cultural arts (The Felix Theater Group, Literary Council) and sports societies. Grow your management and teamwork credentials.
                </p>
              </div>
              <Link href="#contact" className="inline-flex items-center gap-1 text-sm font-bold text-accent group-hover:translate-x-1 transition-all">
                Join a Club
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Support Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between group hover:bg-white/10 transition-all duration-300"
            >
              <div>
                <span className="text-[10px] text-accent tracking-widest uppercase font-bold">Welfare & Career</span>
                <h3 className="font-serif text-2xl font-bold mt-2 mb-4">Student Support Services</h3>
                <p className="text-sm text-teal-100/70 leading-relaxed mb-6">
                  Our comprehensive counselling framework offers psychological checkups, academic assistance, peer mentoring, and intensive placement preparation to ensure you stay healthy and succeed professionally.
                </p>
              </div>
              <Link href="#contact" className="inline-flex items-center gap-1 text-sm font-bold text-accent group-hover:translate-x-1 transition-all">
                Access Support
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Our Latest Stories --- */}
      <section id="stories" className="py-20 md:py-28 bg-[#f8faf9] scroll-mt-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-extrabold tracking-widest text-accent uppercase">
              NEWS & ANNOUNCEMENTS
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-primary tracking-tight mt-2">
              Our Latest Stories
            </h2>
            <div className="h-1 w-12 bg-accent rounded-full mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
            {/* Big Highlight Card */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-sm border border-border bg-slate-100">
                <Image
                  src="/campus_life.png"
                  alt="Students competing in a coding challenge"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider">PROJECT CHALLENGES</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary hover:text-accent transition-colors leading-tight">
                Designing for the Future: Students Take on Global Tech Challenges
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Felix Engineering College teams clean up awards in the International Green Energy Hackathon. Students designed automated battery management grids using Raspberry Pi arrays.
              </p>
              <Link href="#contact" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-accent transition-colors">
                Read Full Story
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* List of Small News Items */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Item 1 */}
              <div className="pb-6 border-b border-border flex flex-col gap-2 group">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">INTERNATIONAL</span>
                <h4 className="font-serif text-md sm:text-lg font-bold text-primary group-hover:text-accent transition-colors leading-snug">
                  FEC Team Receives Outstanding Poster Award at IEEE Photonics Conference
                </h4>
                <p className="text-xs text-muted-foreground">
                  Undergrad researchers showcase energy-efficient optical routers for cloud computing centers.
                </p>
              </div>

              {/* Item 2 */}
              <div className="pb-6 border-b border-border flex flex-col gap-2 group">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">ALUMNI RELATIONS</span>
                <h4 className="font-serif text-md sm:text-lg font-bold text-primary group-hover:text-accent transition-colors leading-snug">
                  Alumni Network Funds $2.5M Smart Grid Incubation Laboratory
                </h4>
                <p className="text-xs text-muted-foreground">
                  The facility will house prototype wind turbines and clean energy test beds for student thesis.
                </p>
              </div>

              {/* Item 3 */}
              <div className="pb-6 border-b border-border flex flex-col gap-2 group">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">RESEARCH</span>
                <h4 className="font-serif text-md sm:text-lg font-bold text-primary group-hover:text-accent transition-colors leading-snug">
                  Dr. Kelly Dunstan Publishes New Research on Nanocomposite Materials
                </h4>
                <p className="text-xs text-muted-foreground">
                  The breakthrough details lightweight shielding compounds designed for space exploration rockets.
                </p>
              </div>

              {/* Item 4 */}
              <div className="flex flex-col gap-2 group">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">SPORTS</span>
                <h4 className="font-serif text-md sm:text-lg font-bold text-primary group-hover:text-accent transition-colors leading-snug">
                  Athletics Board Names New Head Coach of FEC Men's Basketball Team
                </h4>
                <p className="text-xs text-muted-foreground">
                  Former national league forward takes over leadership of the varsity squad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Seize Your Future CTA Banner --- */}
      <section className="bg-primary text-primary-foreground py-20 relative overflow-hidden">
        {/* Decorative backdrop elements */}
        <div className="absolute inset-0 bg-[#051c1a]/90" />
        <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: "url('/campus_hero.png')" }} />
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center flex flex-col items-center gap-6 max-w-3xl">
          <span className="text-xs font-extrabold tracking-widest text-accent uppercase">
            ADMISSIONS OPEN
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Seize your future now
          </h2>
          <p className="text-md sm:text-lg text-teal-100/80 leading-relaxed max-w-xl">
            Join a collaborative community that challenges you to push tech boundaries. Learn, research, and innovate with world-class faculty.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Link href="#contact">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 shadow-md">
                Apply Admission
              </Button>
            </Link>
            <Link href="/notes">
              <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                Explore Notes Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Footer & Contact Details --- */}
      <footer id="contact" className="bg-[#041211] text-teal-100 border-t border-teal-950/60 py-16 scroll-mt-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-16">
            
            {/* College Details */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-[#041211] font-bold font-serif shadow-inner">
                  F
                </div>
                <span className="font-serif text-lg font-bold text-white tracking-tight">
                  Felix Engineering College
                </span>
              </div>
              <p className="text-xs text-teal-200/60 leading-relaxed max-w-sm">
                A premier autonomous engineering institution committed to research-led curricula, innovative student development, and social empowerment.
              </p>
              
              {/* Contact Icons */}
              <div className="flex flex-col gap-3 text-xs text-teal-200/80">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-accent shrink-0" />
                  <span>100 Technology Boulevard, Academic Plaza, FEC Campus, NY 10027</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-accent shrink-0" />
                  <a href="mailto:info@felixcollege.edu" className="hover:text-accent transition-colors">
                    info@felixcollege.edu
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-accent shrink-0" />
                  <span>+1 (555) 019-2834 / +1 (555) 019-2835</span>
                </div>
              </div>
            </div>

            {/* Quick Links Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Column 1 */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-white tracking-widest uppercase border-b border-teal-950 pb-2">
                  Academic Pages
                </span>
                <div className="flex flex-col gap-2.5 text-xs text-teal-200/60">
                  <Link href="#about" className="hover:text-accent transition-colors">About Institutional Focus</Link>
                  <Link href="#programs" className="hover:text-accent transition-colors">Degrees Offered</Link>
                  <Link href="#campus-life" className="hover:text-accent transition-colors">Campus Organizations</Link>
                  <Link href="/notes" className="hover:text-accent transition-colors text-accent font-semibold">Notes & Questions Platform</Link>
                </div>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-white tracking-widest uppercase border-b border-teal-950 pb-2">
                  Students Hub
                </span>
                <div className="flex flex-col gap-2.5 text-xs text-teal-200/60">
                  <Link href="/notes?type=notes" className="hover:text-accent transition-colors">Download Lecture Notes</Link>
                  <Link href="/notes?type=questions" className="hover:text-accent transition-colors">Past Semester Questions</Link>
                  <Link href="/notes" className="hover:text-accent transition-colors">Student Contribution Portal</Link>
                  <Link href="#campus-life" className="hover:text-accent transition-colors">Welfare Services</Link>
                </div>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-white tracking-widest uppercase border-b border-teal-950 pb-2">
                  Social Channels
                </span>
                <div className="flex flex-col gap-2.5 text-xs text-teal-200/60">
                  <a href="#" className="hover:text-accent transition-colors">LinkedIn Portal</a>
                  <a href="#" className="hover:text-accent transition-colors">GitHub Tech Hub</a>
                  <a href="#" className="hover:text-accent transition-colors">X (Twitter) Feed</a>
                  <a href="#" className="hover:text-accent transition-colors">YouTube Video Lectures</a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="border-t border-teal-950/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-teal-200/40">
            <span>© {new Date().getFullYear()} Felix Engineering College. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-accent transition-colors">Terms of Compliance</a>
              <a href="#" className="hover:text-accent transition-colors">Administrative Login</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
