"use client";

import { useState, useMemo, useEffect } from "react";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Folder,
  FileText,
  Plus,
  Search,
  Bell,
  Mail,
  ChevronLeft,
  ChevronRight,
  Settings,
  GraduationCap,
  Users,
  Globe,
  BookOpen,
  X,
  Grid,
  Download,
  ExternalLink,
  ChevronDown,
  ArrowLeft,
  BookMarked,
  Layers,
  FlaskConical,
  UploadCloud,
  Check,
  Compass,
  Loader2,
  BookOpenCheck,
  Trash2,
  LogOut,
  LogIn,
  Shield,
  ShieldX,
  MoreVertical,
  Pencil,
  Share2,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Interfaces for our Academic Platform database
interface DocFile {
  id: string;
  title: string;
  subject: string;
  department: "CSE" | "EEE" | "Civil" | "Mechanical";
  year: "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
  type: "Notes" | "Questions" | "Hand Note" | "Others Campus Note";
  uploadedBy: string;
  uploadDate: string;
  driveId: string; // Google Drive File ID
  color: "blue" | "yellow" | "grey" | "red" | "green";
  size?: string;
}

interface DocFolder {
  id: string;
  name: string;
  department: "CSE" | "EEE" | "Civil" | "Mechanical";
  year: "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
  color: "blue" | "yellow" | "grey" | "red" | "green";
  filesCount: number;
}

// Default seed data for MongoDB
const defaultFolders = [
  { name: "PSY. Midterm", department: "CSE", year: "2nd Year", color: "blue" },
  { name: "Creative Writing Essay Inspo.", department: "Mechanical", year: "3rd Year", color: "yellow" },
  { name: "IND Group Project Folder", department: "Civil", year: "3rd Year", color: "grey" },
  { name: "Class Notes for CRT", department: "EEE", year: "2nd Year", color: "red" },
  { name: "Data Structures & Algorithms", department: "CSE", year: "2nd Year", color: "blue" },
  { name: "Thermodynamics & Heat Transfer", department: "Mechanical", year: "2nd Year", color: "green" },
  { name: "Basic Electrical Eng. Slides", department: "EEE", year: "1st Year", color: "yellow" },
  { name: "Structural Mechanics Lab", department: "Civil", year: "2nd Year", color: "red" },
];

const defaultFiles = [
  {
    title: "Week 5 CRT notes - Computer Networks Intro",
    subject: "Class Notes for CRT",
    department: "EEE",
    year: "2nd Year",
    type: "Notes",
    uploadedBy: "Prof. Sarah Jenkins",
    driveId: "1-W6vC5wR_0LzJv9q-123456789abcde",
    color: "red",
    size: "2.4 MB",
  },
  {
    title: "PHI Midterm Essay - Logic & Reason",
    subject: "PSY. Midterm",
    department: "CSE",
    year: "2nd Year",
    type: "Questions",
    uploadedBy: "Rebecca McDonald (Student)",
    driveId: "1_2H3K4L5M6N7O8P9Q0R_STUVWXYZabc",
    color: "blue",
    size: "1.1 MB",
  },
  {
    title: "Week 4 CRT notes - Routing Protocols",
    subject: "Class Notes for CRT",
    department: "EEE",
    year: "2nd Year",
    type: "Notes",
    uploadedBy: "Prof. Sarah Jenkins",
    driveId: "1A_b2C3d4E5f6G7h8I9j0K1l2M3n4O5p",
    color: "red",
    size: "3.2 MB",
  },
  {
    title: "Data Structures - Trees & Binary Search Week 5",
    subject: "Data Structures & Algorithms",
    department: "CSE",
    year: "2nd Year",
    type: "Notes",
    uploadedBy: "Dr. Alan Turing",
    driveId: "1z9y8x7w6v5u4t3s2r1q0pONMLKJIHGFE",
    color: "blue",
    size: "4.8 MB",
  },
  {
    title: "Thermodynamics - Solved Midterm Papers 2024",
    subject: "Thermodynamics & Heat Transfer",
    department: "Mechanical",
    year: "2nd Year",
    type: "Questions",
    uploadedBy: "Prof. Richard Feynman",
    driveId: "1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q",
    color: "green",
    size: "8.5 MB",
  },
  {
    title: "Soil Mechanics - Foundation Design Notes",
    subject: "IND Group Project Folder",
    department: "Civil",
    year: "3rd Year",
    type: "Notes",
    uploadedBy: "Prof. Karl Terzaghi",
    driveId: "1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r",
    color: "grey",
    size: "6.1 MB",
  },
];

const initialFolders: DocFolder[] = [];
const initialFiles: DocFile[] = [];

// Helper to determine text colors based on design tokens
const getBadgeStyles = (color: string) => {
  switch (color) {
    case "blue":
      return "bg-blue-50 text-blue-700 border-blue-200/50";
    case "yellow":
      return "bg-amber-50 text-amber-800 border-amber-200/50";
    case "red":
      return "bg-rose-50 text-rose-700 border-rose-200/50";
    case "green":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200/50";
  }
};

export default function NotesDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "courses" | "files" | "settings">("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Database State
  const [folders, setFolders] = useState<DocFolder[]>(initialFolders);
  const [files, setFiles] = useState<DocFile[]>(initialFiles);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Files View Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("date-newest");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  // Tracks the course whose Files button was clicked from the Courses tab
  const [activeCourseFilter, setActiveCourseFilter] = useState<{ code: string; title: string } | null>(null);

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Authorization gate for Contribute Notes
  const [isAuthCheckOpen, setIsAuthCheckOpen] = useState(false);
  const [authCheckDenied, setAuthCheckDenied] = useState(false);

  // Helper: open the authorization gate dialog
  const openContributeGate = () => {
    setAuthCheckDenied(false);
    setIsAuthCheckOpen(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (authMode === "signin") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (authName.trim()) {
          await updateProfile(userCred.user, { displayName: authName });
        }
      }
      setIsAuthOpen(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed") {
        setAuthError("Email/Password authentication is disabled. Please enable it in the Firebase Console.");
      } else if (err.code === "auth/invalid-credential") {
        setAuthError("Invalid email or password. Please try again.");
      } else {
        setAuthError(err.message || "An authentication error occurred");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  // File Preview Modal State
  const [previewFile, setPreviewFile] = useState<DocFile | null>(null);

  // Contribute Modal Form State
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState("");
  const [newFileSubject, setNewFileSubject] = useState("");
  const [newFileDept, setNewFileDept] = useState<"CSE" | "EEE" | "Civil" | "Mechanical">("CSE");
  const [newFileYear, setNewFileYear] = useState<"1st Year" | "2nd Year" | "3rd Year" | "4th Year">("2nd Year");
  const [newFileType, setNewFileType] = useState<"Notes" | "Questions" | "Hand Note" | "Others Campus Note">("Notes");
  const [newFileDriveId, setNewFileDriveId] = useState("");
  const [newFileUploader, setNewFileUploader] = useState("Rebecca McDonald");
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // Semester Selection State
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  // Semester & Course API State
  interface SemesterCourse { code: string; title: string; department: string; creditHours: number; instructor?: string; semesterLabel?: string; }
  interface SemesterDoc { label: string; year: string; semNumber: number; }
  const [dbSemesters, setDbSemesters] = useState<SemesterDoc[]>([]);
  const [dbCourses, setDbCourses] = useState<SemesterCourse[]>([]);

  // Add Semester Modal State
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [addSemLabel, setAddSemLabel] = useState("");
  const [addSemYear, setAddSemYear] = useState("1st Year");
  const [addSemNumber, setAddSemNumber] = useState(1);
  const [addSemCourses, setAddSemCourses] = useState<SemesterCourse[]>([
    { code: "", title: "", department: "CSE", creditHours: 3, instructor: "" },
  ]);
  const [addSemLoading, setAddSemLoading] = useState(false);
  const [addSemSuccess, setAddSemSuccess] = useState(false);

  // Add Folder Modal State
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [addFolderLabel, setAddFolderLabel] = useState("");
  const [addFolderDept, setAddFolderDept] = useState<"CSE" | "EEE" | "Civil" | "Mechanical">("CSE");
  const [addFolderYear, setAddFolderYear] = useState<"1st Year" | "2nd Year" | "3rd Year" | "4th Year">("2nd Year");
  const [addFolderColor, setAddFolderColor] = useState<"blue" | "yellow" | "grey" | "red" | "green">("blue");
  const [addFolderLoading, setAddFolderLoading] = useState(false);
  const [addFolderSuccess, setAddFolderSuccess] = useState(false);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [renameFolderLoading, setRenameFolderLoading] = useState(false);
  const openFolderMenuRef = useRef<HTMLDivElement | null>(null);
  const openFolderMenuIdRef = useRef<string | null>(null);

  useEffect(() => {
    openFolderMenuIdRef.current = openFolderMenuId;
  }, [openFolderMenuId]);

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFolderLabel) return;
    setAddFolderLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addFolderLabel,
          department: addFolderDept,
          year: addFolderYear,
          color: addFolderColor,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setFolders((prev) => {
        const existingIdx = prev.findIndex((f) => f.name.toLowerCase() === addFolderLabel.toLowerCase().trim());
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = json.data;
          return copy;
        }
        return [...prev, json.data];
      });

      setAddFolderSuccess(true);
      setTimeout(() => {
        setAddFolderSuccess(false);
        setIsAddFolderOpen(false);
        setAddFolderLabel("");
        setAddFolderDept("CSE");
        setAddFolderYear("2nd Year");
        setAddFolderColor("blue");
      }, 1500);
    } catch (err) {
      console.error("Failed to add folder:", err);
    } finally {
      setAddFolderLoading(false);
    }
  };

  const openFolder = (folder: DocFolder) => {
    setSelectedFolder(folder.name);
    setActiveTab("files");
    setOpenFolderMenuId(null);
    router.replace(`${pathname}?folder=${encodeURIComponent(folder.id)}`);
  };

  const clearFolderSelection = () => {
    setSelectedFolder(null);
    setOpenFolderMenuId(null);
    router.replace(pathname);
  };

  const getFolderShareLink = (folder: DocFolder) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${pathname}?folder=${encodeURIComponent(folder.id)}`;
  };

  const handleShareFolder = async (folder: DocFolder) => {
    const link = getFolderShareLink(folder);
    if (!link) return;

    await navigator.clipboard.writeText(link);
    setOpenFolderMenuId(null);
  };

  const beginRenameFolder = (folder: DocFolder) => {
    setRenameFolderId(folder.id);
    setRenameFolderName(folder.name);
    setIsRenameFolderOpen(true);
    setOpenFolderMenuId(null);
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderId || !renameFolderName.trim()) return;

    setRenameFolderLoading(true);
    try {
      const response = await fetch("/api/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: renameFolderId, name: renameFolderName.trim() }),
      });

      const json = await response.json();
      if (!json.success) throw new Error(json.error);

      setFolders((prev) => prev.map((folder) => (folder.id === renameFolderId ? json.data : folder)));
      setSelectedFolder((current) => (current && current === folders.find((folder) => folder.id === renameFolderId)?.name ? json.data.name : current));
      setIsRenameFolderOpen(false);
      setRenameFolderId(null);
      setRenameFolderName("");
    } catch (err) {
      console.error("Failed to rename folder:", err);
    } finally {
      setRenameFolderLoading(false);
    }
  };

  const handleDeleteFolder = async (folder: DocFolder) => {
    const confirmed = window.confirm(`Delete ${folder.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch("/api/folders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: folder.id }),
      });

      const json = await response.json();
      if (!json.success) throw new Error(json.error);

      setFolders((prev) => prev.filter((item) => item.id !== folder.id));
      if (selectedFolder === folder.name) {
        clearFolderSelection();
      }
      setOpenFolderMenuId(null);
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  };

  useEffect(() => {
    const folderParam = searchParams.get("folder");
    if (!folderParam || folders.length === 0) return;

    const matchedFolder = folders.find((folder) => folder.id === folderParam || folder.name === folderParam);
    if (matchedFolder) {
      setSelectedFolder(matchedFolder.name);
      setActiveTab("files");
    }
  }, [folders, searchParams]);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (!openFolderMenuIdRef.current) return;
      const target = event.target as Node | null;
      if (target && openFolderMenuRef.current?.contains(target)) return;
      setOpenFolderMenuId(null);
    };

    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  // Fetch all semesters, courses, folders, and files from DB on mount
  useEffect(() => {
    fetch("/api/semesters")
      .then((r) => r.json())
      .then((json) => { if (json.success) setDbSemesters(json.data); })
      .catch(() => {});
    fetch("/api/courses")
      .then((r) => r.json())
      .then((json) => { if (json.success) setDbCourses(json.data); })
      .catch(() => {});
    fetch("/api/folders")
      .then((r) => r.json())
      .then((json) => { if (json.success) setFolders(json.data); })
      .catch(() => {});
    fetch("/api/files")
      .then((r) => r.json())
      .then((json) => { if (json.success) setFiles(json.data); })
      .catch(() => {});
  }, []);

  // Courses to show: from DB if found, else fallback static
  // Source: University of Dhaka — B.Sc. in CSE Syllabus (Session 2019-20)
  const staticCoursesBySemester: Record<string, SemesterCourse[]> = {
    "1st Year 1st Semester": [
      { code: "CSE-1101", title: "Fundamentals of Computers and Computing", department: "CSE", creditHours: 2 },
      { code: "CSE-1102", title: "Discrete Mathematics", department: "CSE", creditHours: 3 },
      { code: "EEE-1103", title: "Electrical Circuits", department: "EEE", creditHours: 3 },
      { code: "CHE-1104", title: "Chemistry", department: "CSE", creditHours: 3 },
      { code: "MATH-1105", title: "Differential and Integral Calculus", department: "CSE", creditHours: 3 },
      { code: "SS-1106",   title: "Government and Public Administration", department: "CSE", creditHours: 2 },
      { code: "CSE-1111", title: "Fundamentals of Computers and Computing Lab", department: "CSE", creditHours: 1.5 },
      { code: "EEE-1113", title: "Electrical Circuits Lab", department: "EEE", creditHours: 1.5 },
      { code: "CHE-1114", title: "Chemistry Lab", department: "CSE", creditHours: 1.5 },
    ],
    "1st Year 2nd Semester": [
      { code: "CSE-1201", title: "Fundamentals of Programming", department: "CSE", creditHours: 3 },
      { code: "CSE-1202", title: "Digital Logic Design", department: "CSE", creditHours: 3 },
      { code: "PHY-1203", title: "Physics", department: "CSE", creditHours: 3 },
      { code: "MATH-1204", title: "Methods of Integration, Differential Equations and Series", department: "CSE", creditHours: 3 },
      { code: "ENG-1205",  title: "Developing English Language Skills", department: "CSE", creditHours: 2 },
      { code: "CSE-1211",  title: "Fundamentals of Programming Lab", department: "CSE", creditHours: 3 },
      { code: "CSE-1212",  title: "Digital Logic Design Lab", department: "CSE", creditHours: 1.5 },
      { code: "PHY-1213",  title: "Physics Lab", department: "CSE", creditHours: 1.5 },
      { code: "ENG-1215",  title: "Developing English Language Skills Lab", department: "CSE", creditHours: 1.5 },
    ],
    "2nd Year 3rd Semester": [
      { code: "CSE-2101",  title: "Data Structures and Algorithms", department: "CSE", creditHours: 3 },
      { code: "CSE-2102",  title: "Object Oriented Programming", department: "CSE", creditHours: 3 },
      { code: "CSE-2103",  title: "Digital Electronics and Pulse Technique", department: "CSE", creditHours: 3 },
      { code: "EEE-2104",  title: "Electronic Devices and Circuits", department: "EEE", creditHours: 3 },
      { code: "MATH-2105", title: "Linear Algebra", department: "CSE", creditHours: 3 },
      { code: "SS-2106",   title: "Bangladesh Studies", department: "CSE", creditHours: 2 },
      { code: "CSE-2111",  title: "Data Structures and Algorithms Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-2112",  title: "Object Oriented Programming Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-2113",  title: "Digital Electronics and Pulse Technique Lab", department: "CSE", creditHours: 1.5 },
      { code: "EEE-2114",  title: "Electronic Devices and Circuits Lab", department: "EEE", creditHours: 0.75 },
    ],
    "2nd Year 4th Semester": [
      { code: "CSE-2201", title: "Database Management Systems-I", department: "CSE", creditHours: 3 },
      { code: "CSE-2202", title: "Design and Analysis of Algorithms-I", department: "CSE", creditHours: 3 },
      { code: "CSE-2203", title: "Data and Telecommunication", department: "CSE", creditHours: 3 },
      { code: "CSE-2204", title: "Computer Architecture and Organization", department: "CSE", creditHours: 3 },
      { code: "CSE-2205", title: "Introduction to Mechatronics", department: "CSE", creditHours: 2 },
      { code: "CSE-2211", title: "Database Management Systems-I Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-2212", title: "Design and Analysis of Algorithms-I Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-2213", title: "Data and Telecommunication Lab", department: "CSE", creditHours: 0.75 },
      { code: "CSE-2216", title: "Application Development Lab", department: "CSE", creditHours: 1.5 },
    ],
    "3rd Year 5th Semester": [
      { code: "CSE-3101",  title: "Computer Networking", department: "CSE", creditHours: 3 },
      { code: "CSE-3102",  title: "Software Engineering", department: "CSE", creditHours: 3 },
      { code: "CSE-3103",  title: "Microprocessor and Microcontroller", department: "CSE", creditHours: 3 },
      { code: "CSE-3104",  title: "Database Management Systems-II", department: "CSE", creditHours: 3 },
      { code: "MATH-3105", title: "Multivariable Calculus and Geometry", department: "CSE", creditHours: 3 },
      { code: "CSE-3111",  title: "Computer Networking Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-3112",  title: "Software Engineering Lab", department: "CSE", creditHours: 0.75 },
      { code: "CSE-3113",  title: "Microprocessor and Assembly Language Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-3116",  title: "Microcontroller Lab", department: "CSE", creditHours: 0.75 },
    ],
    "3rd Year 6th Semester": [
      { code: "CSE-3201",  title: "Operating Systems", department: "CSE", creditHours: 3 },
      { code: "CSE-3202",  title: "Numerical Methods", department: "CSE", creditHours: 3 },
      { code: "CSE-3203",  title: "Design and Analysis of Algorithms-II", department: "CSE", creditHours: 3 },
      { code: "CSE-3204",  title: "Formal Language, Automata and Computability", department: "CSE", creditHours: 3 },
      { code: "STAT-3205", title: "Introduction to Probability and Statistics", department: "CSE", creditHours: 3 },
      { code: "CSE-3211",  title: "Operating Systems Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-3212",  title: "Numerical Methods Lab", department: "CSE", creditHours: 0.75 },
      { code: "CSE-3216",  title: "Software Design Patterns Lab", department: "CSE", creditHours: 1.5 },
      { code: "ENG-3217",  title: "Technical Writing and Presentation Lab", department: "CSE", creditHours: 0.75 },
    ],
    "4th Year 7th Semester": [
      { code: "CSE-4101",  title: "Artificial Intelligence", department: "CSE", creditHours: 3 },
      { code: "CSE-4102",  title: "Mathematical and Statistical Analysis for Engineers", department: "CSE", creditHours: 3 },
      { code: "SS-4103",   title: "Entrepreneurship for IT Business", department: "CSE", creditHours: 2 },
      { code: "CSE-4XXX",  title: "Option-I (Elective)", department: "CSE", creditHours: 3 },
      { code: "CSE-4XXX",  title: "Option-II (Elective)", department: "CSE", creditHours: 3 },
      { code: "CSE-4111",  title: "Artificial Intelligence Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-4XXX",  title: "Option-I Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-4113",  title: "Internet Programming Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-4114",  title: "Project (Phase I)", department: "CSE", creditHours: 2 },
    ],
    "4th Year 8th Semester": [
      { code: "ECO-4201",  title: "Economics", department: "CSE", creditHours: 2 },
      { code: "CSE-4202",  title: "Society and Technology", department: "CSE", creditHours: 2 },
      { code: "SS-4203",   title: "Engineering Ethics", department: "CSE", creditHours: 2 },
      { code: "CSE-4XXX",  title: "Option-III (Elective)", department: "CSE", creditHours: 3 },
      { code: "CSE-4XXX",  title: "Option-IV (Elective)", department: "CSE", creditHours: 3 },
      { code: "CSE-4XXX",  title: "Option-III Lab", department: "CSE", creditHours: 1.5 },
      { code: "CSE-4214",  title: "Project (Phase II)", department: "CSE", creditHours: 4 },
    ],
  };

  // Syllabus sync / migration state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSyncSyllabus = async () => {
    setIsSyncing(true);
    try {
      const semestersToSync = [
        { label: "1st Year 1st Semester", year: "1st Year", semNumber: 1 },
        { label: "1st Year 2nd Semester", year: "1st Year", semNumber: 2 },
        { label: "2nd Year 3rd Semester", year: "2nd Year", semNumber: 3 },
        { label: "2nd Year 4th Semester", year: "2nd Year", semNumber: 4 },
        { label: "3rd Year 5th Semester", year: "3rd Year", semNumber: 5 },
        { label: "3rd Year 6th Semester", year: "3rd Year", semNumber: 6 },
        { label: "4th Year 7th Semester", year: "4th Year", semNumber: 7 },
        { label: "4th Year 8th Semester", year: "4th Year", semNumber: 8 },
      ];

      // 1. Sync semesters (without courses)
      for (const sem of semestersToSync) {
        await fetch("/api/semesters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: sem.label, year: sem.year, semNumber: sem.semNumber }),
        });
      }

      // 2. Sync courses to the standalone /api/courses endpoint
      for (const sem of semestersToSync) {
        const courses = staticCoursesBySemester[sem.label] || [];
        for (const course of courses) {
          await fetch("/api/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...course, semesterLabel: sem.label }),
          });
        }
      }

      // 3. Sync default folders
      for (const folder of defaultFolders) {
        await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(folder),
        });
      }

      // 4. Sync default files
      for (const file of defaultFiles) {
        await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(file),
        });
      }

      // 5. Re-fetch semesters, courses, folders, and files from DB
      const [semRes, courseRes, foldersRes, filesRes] = await Promise.all([
        fetch("/api/semesters").then((r) => r.json()),
        fetch("/api/courses").then((r) => r.json()),
        fetch("/api/folders").then((r) => r.json()),
        fetch("/api/files").then((r) => r.json()),
      ]);
      if (semRes.success) setDbSemesters(semRes.data);
      if (courseRes.success) setDbCourses(courseRes.data);
      if (foldersRes.success) setFolders(foldersRes.data);
      if (filesRes.success) setFiles(filesRes.data);
      if (!searchParams.get("folder")) {
        setSelectedFolder(null);
      }

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to sync syllabus data:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // activeSemesterCourses: prefer DB courses filtered by semesterLabel, fallback to static
  const activeSemesterCourses: SemesterCourse[] = selectedSemester
    ? (() => {
        const fromDb = dbCourses.filter((c) => c.semesterLabel === selectedSemester);
        return fromDb.length > 0 ? fromDb : (staticCoursesBySemester[selectedSemester] ?? []);
      })()
    : [];

  // Handler: save new semester and its courses to DB
  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSemLabel || !addSemYear || !addSemNumber) return;
    setAddSemLoading(true);
    try {
      // 1. Save the semester
      const semRes = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: addSemLabel, year: addSemYear, semNumber: addSemNumber }),
      });
      const semJson = await semRes.json();
      if (!semJson.success) throw new Error(semJson.error);

      // 2. Save each course to the standalone /api/courses endpoint
      const validCourses = addSemCourses.filter((c) => c.code && c.title);
      for (const course of validCourses) {
        await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...course, semesterLabel: addSemLabel }),
        });
      }

      // 3. Update local state: add semester + new courses
      setDbSemesters((prev) => {
        const existing = prev.findIndex((s) => s.label === semJson.data.label);
        if (existing >= 0) { const n = [...prev]; n[existing] = semJson.data; return n; }
        return [...prev, semJson.data];
      });
      setDbCourses((prev) => {
        const others = prev.filter((c) => c.semesterLabel !== addSemLabel);
        return [...others, ...validCourses.map((c) => ({ ...c, semesterLabel: addSemLabel }))];
      });

      setAddSemSuccess(true);
      setTimeout(() => { setAddSemSuccess(false); setIsAddSemesterOpen(false); }, 1500);
    } catch { /* silently fail */ }
    finally { setAddSemLoading(false); }
  };

  // Contribute Form submission
  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileTitle || !newFileDriveId || !newFileSubject) return;

    // Clean Google Drive URL to get ID if they pasted a full link
    let extractedId = newFileDriveId.trim();
    if (extractedId.includes("drive.google.com")) {
      const match = extractedId.match(/\/d\/([a-zA-Z0-9_-]+)/) || extractedId.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        extractedId = match[1];
      }
    }

    const colorMap: Record<string, "blue" | "yellow" | "grey" | "red" | "green"> = {
      CSE: "blue",
      EEE: "red",
      Civil: "grey",
      Mechanical: "green",
    };

    const targetColor = colorMap[newFileDept] || "grey";
    const fileSize = `${(Math.random() * 5 + 1).toFixed(1)} MB`;

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newFileTitle,
          subject: newFileSubject,
          department: newFileDept,
          year: newFileYear,
          type: newFileType,
          uploadedBy: currentUser
            ? (currentUser.displayName || currentUser.email || "Anonymous Student")
            : (newFileUploader || "Anonymous Student"),
          driveId: extractedId,
          color: targetColor,
          size: fileSize,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      // Re-fetch folders & files to sync up local state with DB
      const [foldersRes, filesRes] = await Promise.all([
        fetch("/api/folders").then((r) => r.json()),
        fetch("/api/files").then((r) => r.json()),
      ]);
      if (foldersRes.success) setFolders(foldersRes.data);
      if (filesRes.success) setFiles(filesRes.data);

      setIsSubmitSuccess(true);
      setTimeout(() => {
        setIsSubmitSuccess(false);
        setIsContributeOpen(false);
        // Reset form fields
        setNewFileTitle("");
        setNewFileSubject("");
        setNewFileDriveId("");
      }, 1500);
    } catch (err) {
      console.error("Failed to submit resource:", err);
    }
  };

  // Filter Logic
  const filteredFolders = useMemo(() => {
    return folders.filter((folder) => {
      const matchCourse = selectedCourse === "All" || folder.name === selectedCourse;
      const matchYear = selectedYear === "All" || folder.year === selectedYear;

      const matchActiveCourse = !activeCourseFilter ||
        folder.name.toLowerCase().includes(activeCourseFilter.title.toLowerCase()) ||
        folder.name.toLowerCase().includes(activeCourseFilter.code.toLowerCase()) ||
        folder.name.toLowerCase().replace(/[\s-]/g, "").includes(activeCourseFilter.code.toLowerCase().replace(/[\s-]/g, "")) ||
        activeCourseFilter.code.toLowerCase().replace(/[\s-]/g, "").includes(folder.name.toLowerCase().replace(/[\s-]/g, "")) ||
        folder.name.toLowerCase().replace(/[\s-]/g, "").includes(activeCourseFilter.title.toLowerCase().replace(/[\s-]/g, "")) ||
        activeCourseFilter.title.toLowerCase().replace(/[\s-]/g, "").includes(folder.name.toLowerCase().replace(/[\s-]/g, ""));

      return matchCourse && matchYear && matchActiveCourse;
    });
  }, [folders, selectedCourse, selectedYear, activeCourseFilter]);

  const filteredFiles = useMemo(() => {
    let result = files.filter((file) => {
      const matchCourse = selectedCourse === "All" || file.subject === selectedCourse;
      const matchYear = selectedYear === "All" || file.year === selectedYear;
      const matchType = selectedType === "All" || file.type === selectedType;
      const matchFolder = !selectedFolder || file.subject.toLowerCase() === selectedFolder.toLowerCase();
      const matchSearch =
        file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

      // If filtering by a specific course from the Courses tab,
      // match files where subject contains the course title or course code
      const matchActiveCourse = !activeCourseFilter ||
        file.subject.toLowerCase().includes(activeCourseFilter.title.toLowerCase()) ||
        file.subject.toLowerCase().includes(activeCourseFilter.code.toLowerCase()) ||
        file.title.toLowerCase().includes(activeCourseFilter.title.toLowerCase()) ||
        file.title.toLowerCase().includes(activeCourseFilter.code.toLowerCase());

      return matchCourse && matchYear && matchType && matchFolder && matchSearch && matchActiveCourse;
    });

    // Sorting logic
    result = [...result].sort((a, b) => {
      if (sortBy === "type") {
        const typeOrder: Record<string, number> = {
          "Notes": 1,
          "Hand Note": 2,
          "Questions": 3,
          "Others Campus Note": 4
        };
        const orderA = typeOrder[a.type] || 99;
        const orderB = typeOrder[b.type] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === "date-oldest") {
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      // default: date-newest
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });

    return result;
  }, [files, selectedCourse, selectedYear, selectedType, selectedFolder, searchQuery, activeCourseFilter, sortBy]);

  const openCourseFiles = (course: SemesterCourse) => {
    setActiveCourseFilter({ code: course.code, title: course.title });
    clearFolderSelection();
    setSelectedCourse("All");
    setSelectedType("All");
    setSearchQuery("");
    setSelectedYear(
      selectedSemester?.startsWith("1st") ? "1st Year" :
      selectedSemester?.startsWith("2nd") ? "2nd Year" :
      selectedSemester?.startsWith("3rd") ? "3rd Year" : "4th Year"
    );
    setActiveTab("files");
  };

  const goBackFromSection = () => {
    if (activeTab === "courses") {
      setActiveTab("dashboard");
      return;
    }

    if (activeTab === "files") {
      if (activeCourseFilter) {
        setActiveCourseFilter(null);
        setActiveTab("courses");
        return;
      }

      if (selectedFolder) {
        clearFolderSelection();
        return;
      }

      setActiveTab("dashboard");
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f5f6] text-foreground font-sans overflow-hidden dark:bg-[#071412] dark:text-teal-50">
      
      {/* --- Sidebar ("My Slice") --- */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`h-full bg-white dark:bg-[#0b1d1a] border-r border-border shrink-0 flex flex-col justify-between py-6 z-20 shadow-sm transition-all duration-300 ${
          isSidebarCollapsed ? "px-3" : "px-6"
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className={`flex ${isSidebarCollapsed ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
            <Link href="/" className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? "justify-center" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg border border-accent/20 shrink-0">
                <span className="text-accent font-serif">F</span>
              </div>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col animate-in fade-in duration-300"
                >
                  <span className="font-serif text-lg font-bold tracking-tight text-primary dark:text-teal-100">
                    My Slice
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Student Portal
                  </span>
                </motion.div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Menu Links */}
          <nav className="flex flex-col gap-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: Grid },
              { id: "calendar", label: "Calendar", icon: BookOpen },
              { id: "courses", label: "Courses", icon: Layers },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    clearFolderSelection();
                  }}
                  className={`flex items-center rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isSidebarCollapsed
                      ? "justify-center w-12 h-12 p-0 mx-auto"
                      : "gap-4 px-4 py-3 w-full"
                  } ${
                    isActive
                      ? "bg-slate-100 text-primary dark:bg-slate-800 dark:text-teal-200"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-slate-900"
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                  {!isSidebarCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-in fade-in duration-300">
                      {item.label}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel Links */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className={`flex items-center text-muted-foreground hover:text-foreground font-semibold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
              isSidebarCollapsed
                ? "justify-center w-12 h-12 p-0 mx-auto"
                : "gap-4 px-4 py-3"
            }`}
            title={isSidebarCollapsed ? "FEC College Page" : undefined}
          >
            <Compass className="w-5 h-5 text-accent shrink-0" />
            {!isSidebarCollapsed && <span>FEC College Page</span>}
          </Link>
          <div className="border-t border-border pt-4 text-[10px] text-center text-muted-foreground">
            {!isSidebarCollapsed && <span>Felix College v2.0 • Autonomous</span>}
          </div>
        </div>
      </motion.aside>

      {/* --- Main Dashboard Container --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* --- Top Navbar Bar --- */}
        <header className="h-20 bg-white dark:bg-[#0b1d1a] border-b border-border px-8 flex items-center justify-between shrink-0 z-10 shadow-sm">
          {/* Search bar widget */}
          <div className="relative w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search resource, class, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-slate-50 dark:bg-slate-900 border-border focus:ring-accent w-full text-xs rounded-xl"
            />
          </div>

          {/* User Widget */}
          <div className="flex items-center gap-6">
            <button className="relative text-muted-foreground hover:text-foreground p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>
            <button className="relative text-muted-foreground hover:text-foreground p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <Mail className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                11
              </span>
            </button>

            <div className="h-8 w-px bg-border" />

            {/* Profile Avatar Card */}
            {isAuthLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-primary dark:text-teal-200">
                    {currentUser.displayName || currentUser.email?.split("@")[0] || "Student"}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    {currentUser.email}
                  </span>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleSignOut}
                    className="w-10 h-10 rounded-full border border-accent/20 flex items-center justify-center bg-primary text-primary-foreground font-bold text-xs shadow-sm shrink-0 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer group"
                    title="Sign Out"
                  >
                    {(() => {
                      const name = currentUser.displayName || currentUser.email || "S";
                      const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                      return (
                        <>
                          <span className="group-hover:hidden">{initials}</span>
                          <LogOut className="w-4 h-4 hidden group-hover:block mx-auto" />
                        </>
                      );
                    })()}
                  </button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setAuthMode("signin");
                  setAuthError(null);
                  setIsAuthOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 py-2 font-bold rounded-xl flex items-center gap-2 shadow-sm border border-accent/20 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            )}
          </div>
        </header>

        {/* --- Dynamic Content Body Panel --- */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-[#051412]">
          
          <AnimatePresence mode="wait">
            
            {/* ================= VIEW: DASHBOARD ================= */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-8 max-w-7xl mx-auto"
              >
                {/* News Campus update Banner */}
                <div className="relative w-full rounded-3xl overflow-hidden shadow-sm aspect-[21/9] lg:aspect-[28/9] border border-border group bg-primary">
                  <Image
                    src="/campus_hero.png"
                    alt="FEC Autumn Building"
                    fill
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    loading="eager"
                    className="object-cover opacity-60 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col justify-end p-8 gap-3">
                    <span className="text-[10px] font-bold text-accent tracking-widest uppercase bg-accent/20 border border-accent/40 rounded-full px-3 py-1 w-fit">
                      CAMPUS UPDATES
                    </span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white max-w-2xl leading-tight">
                      New Staff within Office of Diversity and Inclusion Enhances Efforts to Create More Welcoming Campus.
                    </h2>
                    <Link href="#" className="inline-flex items-center gap-1.5 text-xs text-accent font-bold group-hover:underline">
                      View Campus Update
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Card: Semester Selection widget */}
                  <div className="lg:col-span-4 bg-white dark:bg-[#0b1d1a] p-6 rounded-3xl border border-border shadow-sm flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="font-serif font-bold text-sm text-primary dark:text-teal-200">Semester</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Select your current semester</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (selectedSemester) {
                              const [yr, , sem] = selectedSemester.split(" ");
                              const semNum = parseInt(selectedSemester.match(/(\d+)(?:st|nd|rd|th) Semester/)?.[1] ?? "1");
                              const yearLabel = `${yr} Year`;
                              // map to semNumber
                              const semMap: Record<string,number> = {"1st Year 1st Semester":1,"1st Year 2nd Semester":2,"2nd Year 3rd Semester":3,"2nd Year 4th Semester":4,"3rd Year 5th Semester":5,"3rd Year 6th Semester":6,"4th Year 7th Semester":7,"4th Year 8th Semester":8};
                              setAddSemLabel(selectedSemester);
                              setAddSemYear(selectedSemester.split(" ").slice(0,2).join(" "));
                              setAddSemNumber(semMap[selectedSemester] ?? 1);
                            }
                            setIsAddSemesterOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground font-bold text-[10px] hover:bg-accent/90 transition-colors shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-accent" />
                        </div>
                      </div>
                    </div>

                    {/* Year groups */}
                    <div className="flex flex-col gap-3">
                      {[
                        { year: "1st Year", color: "teal", semesters: ["1st Semester", "2nd Semester"] },
                        { year: "2nd Year", color: "teal", semesters: ["3rd Semester", "4th Semester"] },
                        { year: "3rd Year", color: "teal", semesters: ["5th Semester", "6th Semester"] },
                        { year: "4th Year", color: "teal", semesters: ["7th Semester", "8th Semester"] },
                      ].map(({ year, color, semesters }, yIdx) => {
                        const colorMap: Record<string, { badge: string; btn: string; activebtn: string }> = {
                          teal: { badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300", btn: "border-teal-100 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20", activebtn: "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-300/50" },
                        };
                        const styles = colorMap[color] || colorMap.teal;
                        return (
                          <div key={yIdx} className="flex flex-col gap-1.5">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${styles.badge}`}>
                              {year}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {semesters.map((sem, sIdx) => {
                                const label = `${year} ${sem}`;
                                const isActive = selectedSemester === label;
                                return (
                                  <motion.button
                                    key={sIdx}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setSelectedSemester(isActive ? null : label)}
                                    className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                      isActive ? styles.activebtn : `border-border text-muted-foreground ${styles.btn}`
                                    }`}
                                  >
                                    <span className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-0.5">
                                      Sem {yIdx * 2 + sIdx + 1}
                                    </span>
                                    {sem}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active semester confirmation banner */}
                    <AnimatePresence>
                      {selectedSemester && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="mt-1 p-3 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[9px] text-accent font-bold uppercase tracking-widest">Active Semester</p>
                              <p className="text-xs font-bold text-primary dark:text-teal-200 truncate">{selectedSemester}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveTab("courses")}
                              className="text-[10px] font-bold text-accent whitespace-nowrap hover:text-primary transition-colors"
                            >
                              Courses →
                            </button>
                            <button
                              onClick={() => { setSelectedYear(selectedSemester!.startsWith("1st") ? "1st Year" : selectedSemester!.startsWith("2nd") ? "2nd Year" : selectedSemester!.startsWith("3rd") ? "3rd Year" : "4th Year"); setActiveTab("files"); }}
                              className="text-[10px] font-bold text-muted-foreground whitespace-nowrap hover:text-primary transition-colors"
                            >
                              Files →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card: Courses — driven by selected semester */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#0b1d1a] p-6 rounded-3xl border border-border shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="font-serif font-bold text-sm text-primary dark:text-teal-200">Courses</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {selectedSemester ? selectedSemester : "Select a semester to view courses"}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("courses")}
                        className="text-[10px] font-bold text-accent uppercase tracking-wide hover:text-primary transition-colors"
                      >
                        Full View
                      </button>
                    </div>

                    {!selectedSemester ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-accent/60" />
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold">
                          Pick a semester from the left panel
                        </p>
                      </div>
                    ) : activeSemesterCourses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">No courses added yet.</p>
                        <button
                          onClick={() => setIsAddSemesterOpen(true)}
                          className="text-[10px] font-bold text-accent hover:underline"
                        >
                          + Add courses via the Add button
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-72 pr-1">
                        {activeSemesterCourses.map((course, idx) => {
                          const colors = ["bg-blue-500","bg-amber-500","bg-emerald-500","bg-purple-500","bg-rose-500","bg-teal-500"];
                          const bg = colors[idx % colors.length];
                          return (
                            <div
                              key={idx}
                              role="button"
                              tabIndex={0}
                              onClick={() => openCourseFiles(course)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openCourseFiles(course);
                                }
                              }}
                              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>
                                  {course.code.split("-")[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-primary dark:text-teal-200 leading-tight">{course.title}</span>
                                  <span className="text-[10px] text-muted-foreground font-semibold">{course.code}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-right shrink-0">
                                <span className="text-[10px] font-bold text-muted-foreground">{course.creditHours} cr</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">{course.department}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Card: Recently Added (Folders and files lists) */}
                  <div className="lg:col-span-3 bg-white dark:bg-[#0b1d1a] p-6 rounded-3xl border border-border shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="font-serif font-bold text-sm text-primary dark:text-teal-200">Recently Added</h3>
                      <button
                        onClick={() => {
                          setSelectedFolder(null);
                          setSelectedCourse("All");
                          setSelectedType("All");
                          setActiveCourseFilter(null);
                          setSearchQuery("");
                          setActiveTab("files");
                        }}
                        className="text-[10px] font-bold text-accent uppercase tracking-wide cursor-pointer hover:underline"
                      >
                        All Files
                      </button>
                    </div>

                    {/* Section: Recent Files */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Recent Files
                      </span>

                      {files.slice(0, 3).map((file) => (
                        <div
                          key={file.id}
                          onClick={() => setPreviewFile(file)}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer group"
                        >
                          <FileText className="w-4 h-4 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-semibold text-primary truncate dark:text-teal-250 group-hover:text-accent transition-colors">
                              {file.title}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate">
                              Uploaded by {file.uploadedBy} • {file.size}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Section: Recent Folders */}
                    <div className="flex flex-col gap-3 mt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Recent Folders
                      </span>

                      {folders.slice(0, 3).map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => {
                            openFolder(folder);
                            setSelectedCourse("All");
                            setSelectedType("All");
                            setActiveCourseFilter(null);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer group relative"
                        >
                          <Folder className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-semibold text-primary truncate dark:text-teal-250 group-hover:text-accent transition-colors">
                              {folder.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {folder.filesCount} Files • {folder.year}
                            </span>
                          </div>
                          <div
                            data-folder-menu="true"
                            ref={openFolderMenuId === folder.id ? openFolderMenuRef : null}
                            className="relative"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenFolderMenuId((current) => (current === folder.id ? null : folder.id));
                              }}
                              className="text-muted-foreground hover:text-primary rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Folder actions for ${folder.name}`}
                              title="Folder actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                              {openFolderMenuId === folder.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-8 w-44 rounded-2xl border border-border bg-white p-2 shadow-xl dark:bg-[#0b1d1a] z-30"
                                >
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      beginRenameFolder(folder);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-slate-50 dark:hover:bg-slate-900"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-accent" />
                                    Rename
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleShareFolder(folder);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-slate-50 dark:hover:bg-slate-900"
                                  >
                                    <Share2 className="h-3.5 w-3.5 text-accent" />
                                    Share link
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDeleteFolder(folder);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ================= VIEW: FILES (NOTES & QUESTIONS PLATFORM) ================= */}
            {activeTab === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 max-w-7xl mx-auto"
              >
                {/* Section Title & Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <h1 className="font-serif text-3xl font-extrabold text-primary dark:text-teal-100 flex items-center gap-2">
                        {activeTab === "files" && !selectedFolder && !activeCourseFilter && (
                          <button
                            type="button"
                            onClick={goBackFromSection}
                            className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-accent shadow-sm transition-colors hover:bg-slate-50 dark:bg-[#0b1d1a] dark:hover:bg-slate-900"
                            aria-label="Back to previous section"
                            title="Back to previous section"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                        )}
                      {selectedFolder ? (
                        <>
                          <button
                            onClick={clearFolderSelection}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 mr-1"
                          >
                            <ArrowLeft className="w-5 h-5 text-accent" />
                          </button>
                          {selectedFolder} Files
                        </>
                      ) : activeCourseFilter ? (
                        <>
                          <button
                            onClick={() => { setActiveCourseFilter(null); setActiveTab("courses"); }}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 mr-1"
                            title="Back to My Courses"
                          >
                            <ArrowLeft className="w-5 h-5 text-accent" />
                          </button>
                          {activeCourseFilter.title}
                        </>
                      ) : (
                        "Academic Files"
                      )}
                    </h1>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                      {selectedFolder
                        ? `Displaying files matching ${selectedFolder} subject directory`
                        : activeCourseFilter
                        ? `Showing files for ${activeCourseFilter.code} — ${activeCourseFilter.title} · sorted by name`
                        : "Filter & search through engineering lecture notes & question papers"}
                    </p>
                  </div>

                  {/* Plus CTA Contribute & Create Folder Buttons */}
                  <div className="flex items-center gap-3">
                    {currentUser && (
                      <Button
                        onClick={() => setIsAddFolderOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:-translate-y-0.5 transition-all gap-2 cursor-pointer border border-accent/20 h-10 px-4 text-xs rounded-xl flex items-center justify-center"
                      >
                        <Folder className="w-4 h-4 text-amber-500" />
                        Create Folder
                      </Button>
                    )}
                    <Button
                      onClick={openContributeGate}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-md hover:-translate-y-0.5 transition-all gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Contribute Notes
                    </Button>
                  </div>
                </div>

                {/* Course Filter Breadcrumb Banner */}
                {activeCourseFilter && (
                  <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                        <BookOpenCheck className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                          Topic Filter Active
                        </span>
                        <span className="text-xs font-semibold text-primary dark:text-teal-200">
                          <span className="font-mono text-[10px] bg-accent/15 px-1.5 py-0.5 rounded text-accent mr-2">{activeCourseFilter.code}</span>
                          {activeCourseFilter.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setActiveCourseFilter(null); setActiveTab("courses"); }}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to My Courses
                      </button>
                      <button
                        onClick={() => setActiveCourseFilter(null)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        Clear Filter
                      </button>
                    </div>
                  </div>
                )}

                {/* Filter Toolbar Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-[#0b1d1a] p-4 rounded-2xl border border-border shadow-sm text-xs">
                  {/* Filter Type */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Resource Type</span>
                    <div className="relative">
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-lg p-2 font-semibold text-primary dark:text-teal-200 appearance-none cursor-pointer pr-8"
                      >
                        <option value="All">All Types (Notes, Qs & More)</option>
                        <option value="Notes">Lecture Notes</option>
                        <option value="Questions">Question Papers</option>
                        <option value="Hand Note">Hand Notes</option>
                        <option value="Others Campus Note">Others Campus Notes</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Sort By Option */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Sort By</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-lg p-2 font-semibold text-primary dark:text-teal-200 appearance-none cursor-pointer pr-8"
                      >
                        <option value="date-newest">Date Uploaded (Newest)</option>
                        <option value="date-oldest">Date Uploaded (Oldest)</option>
                        <option value="type">Resource Type (Notes first)</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Search count / Clear Filters */}
                  <div className="flex flex-col justify-end">
                    {(selectedCourse !== "All" || selectedYear !== "All" || selectedType !== "All" || activeCourseFilter || sortBy !== "date-newest") && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedCourse("All");
                          setSelectedYear("All");
                          setSelectedType("All");
                          setActiveCourseFilter(null);
                          setSortBy("date-newest");
                        }}
                        className="text-accent font-bold hover:text-primary p-2 h-9 text-xs w-fit"
                      >
                        Clear Active Filters & Sort
                      </Button>
                    )}
                  </div>
                </div>

                {/* --- FOLDER SECTION (Render only when not inside a folder) --- */}
                {!selectedFolder && (
                  <div className="flex flex-col gap-4">
                    <h3 className="font-serif font-bold text-sm text-primary dark:text-teal-200 tracking-wide uppercase border-b border-border pb-2">
                      Folders
                    </h3>
                    
                    {filteredFolders.length === 0 ? (
                      <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-border">
                        <span className="text-xs text-muted-foreground">No folders match the selected filters.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredFolders.map((folder) => {
                          const badgeColor = getBadgeStyles(folder.color);
                          return (
                            <motion.div
                              whileHover={{ y: -3 }}
                              onClick={() => openFolder(folder)}
                              key={folder.id}
                              className="bg-amber-50/60 dark:bg-[#0c2420] border border-amber-250/30 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-[130px] group relative overflow-hidden"
                            >
                              <div
                                data-folder-menu="true"
                                ref={openFolderMenuId === folder.id ? openFolderMenuRef : null}
                                className="absolute right-3 top-3 z-20"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenFolderMenuId((current) => (current === folder.id ? null : folder.id));
                                  }}
                                  className="rounded-full border border-border/70 bg-white/90 p-2 text-muted-foreground shadow-sm opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 dark:bg-[#0b1d1a]/90"
                                  aria-label={`Open actions for ${folder.name}`}
                                  title="Folder actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                <AnimatePresence>
                                  {openFolderMenuId === folder.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute right-0 top-11 w-44 rounded-2xl border border-border bg-white p-2 shadow-xl dark:bg-[#0b1d1a] z-30"
                                    >
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          beginRenameFolder(folder);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-slate-50 dark:hover:bg-slate-900"
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-accent" />
                                        Rename
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void handleShareFolder(folder);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-slate-50 dark:hover:bg-slate-900"
                                      >
                                        <Share2 className="h-3.5 w-3.5 text-accent" />
                                        Share link
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void handleDeleteFolder(folder);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <div className="flex justify-between items-start">
                                {/* Folder Tab Graphic design styling */}
                                <div className="absolute top-0 left-5 w-12 h-2 bg-amber-500 rounded-b-md" />
                                <Folder className="w-8 h-8 text-amber-500" />
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                  {folder.department}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-serif text-sm font-bold text-primary dark:text-teal-150 truncate leading-snug group-hover:text-accent transition-colors">
                                  {folder.name}
                                </h4>
                                <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">
                                  {folder.filesCount} Files • {folder.year}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* --- FILES / RESOURCE CARDS SECTION --- */}
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="font-serif font-bold text-sm text-primary dark:text-teal-200 tracking-wide uppercase">
                      {selectedFolder ? `${selectedFolder} Files` : "Recent & Shared Files"}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      Showing {filteredFiles.length} item(s)
                    </span>
                  </div>

                  {filteredFiles.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-[#0b1d1a] rounded-3xl border border-dashed border-border flex flex-col items-center gap-3">
                      <FileText className="w-8 h-8 text-muted-foreground animate-pulse" />
                      <span className="text-xs font-semibold text-muted-foreground">No notes or questions found.</span>
                      <Button
                        onClick={openContributeGate}
                        size="sm"
                        variant="outline"
                        className="text-accent border-accent hover:bg-accent/15 cursor-pointer"
                      >
                        Submit the first document
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredFiles.map((file) => {
                        const badgeColor = getBadgeStyles(file.color);
                        return (
                          <motion.div
                            whileHover={{ y: -3 }}
                            key={file.id}
                            className="bg-white dark:bg-[#0c201d] border border-border/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[180px] relative overflow-hidden"
                          >
                            {/* Color tab indicator */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                              file.color === "blue" ? "bg-blue-500" :
                              file.color === "yellow" ? "bg-amber-500" :
                              file.color === "red" ? "bg-rose-500" :
                              file.color === "green" ? "bg-emerald-500" : "bg-slate-400"
                            }`} />

                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[8px] tracking-wider font-bold uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                  {file.department} • {file.type}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-bold font-mono">
                                  {file.size}
                                </span>
                              </div>
                              <h4 className="font-serif text-sm font-extrabold text-primary dark:text-teal-150 leading-snug line-clamp-2">
                                {file.title}
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Subject: {file.subject}
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-muted-foreground">Uploaded by</span>
                                <span className="text-[10px] font-bold text-primary dark:text-teal-200 truncate max-w-[120px]">
                                  {file.uploadedBy}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => setPreviewFile(file)}
                                className="bg-[#f0f4f3] hover:bg-accent hover:text-accent-foreground text-primary font-bold text-xs h-8 rounded-lg border border-border"
                              >
                                View File
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ================= VIEW: CALENDAR (FULLSCREEN) ================= */}
            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto bg-white dark:bg-[#0b1d1a] p-8 rounded-3xl border border-border shadow-sm flex flex-col gap-6"
              >
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-primary dark:text-teal-150">Schedules & Timetable</h2>
                    <p className="text-xs text-muted-foreground">View exams, submissions, and active events</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-accent/20 text-accent rounded-full border border-accent/40">
                    March 2021
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Calendar list */}
                  <div className="flex flex-col gap-4">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">UPCOMING SUBMISSIONS</span>
                    <div className="flex flex-col gap-3">
                      <div className="p-4 rounded-2xl border border-border bg-blue-50/20 flex flex-col gap-1">
                        <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">MARCH 1 • PHILOSOPHY</span>
                        <h4 className="text-xs font-bold text-primary dark:text-teal-150">Maslow's Pyramid Essay Due (100 pts)</h4>
                        <span className="text-[10px] text-muted-foreground">Prof. Smith • Submit in Room 204</span>
                      </div>
                      <div className="p-4 rounded-2xl border border-border bg-purple-50/20 flex flex-col gap-1">
                        <span className="text-[9px] text-purple-500 font-bold uppercase tracking-wider">MARCH 2 • INDUSTRIAL DESIGN</span>
                        <h4 className="text-xs font-bold text-primary dark:text-teal-150">Project Critique Session (Midterm presentation)</h4>
                        <span className="text-[10px] text-muted-foreground">Prof. Whitman • Bring scale model</span>
                      </div>
                      <div className="p-4 rounded-2xl border border-border bg-rose-50/20 flex flex-col gap-1">
                        <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">MARCH 26 • CRT NOTES</span>
                        <h4 className="text-xs font-bold text-primary dark:text-teal-150">Week 5 CRT notes collection & MCQ test</h4>
                        <span className="text-[10px] text-muted-foreground">Prof. Jenkins • Online test portal</span>
                      </div>
                    </div>
                  </div>

                  {/* Tips card */}
                  <div className="bg-primary text-primary-foreground p-6 rounded-2xl flex flex-col gap-4 border border-accent/20">
                    <BookMarked className="w-8 h-8 text-accent" />
                    <h3 className="font-serif text-lg font-bold text-white">Need exam preparations?</h3>
                    <p className="text-xs text-teal-100/80 leading-relaxed">
                      All class notes, previous semesters papers, and syllabus updates are available inside the Files tab. Simply filter by your department and semester to get download links.
                    </p>
                    <Button
                      onClick={() => setActiveTab("files")}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs w-fit"
                    >
                      Browse Files Repository
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= VIEW: COURSES (DETAILS) ================= */}
            {activeTab === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto flex flex-col gap-6"
              >
                {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={goBackFromSection}
                        className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-accent shadow-sm transition-colors hover:bg-slate-50 dark:bg-[#0b1d1a] dark:hover:bg-slate-900"
                        aria-label="Back to previous section"
                        title="Back to previous section"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <div>
                        <h2 className="font-serif text-3xl font-extrabold text-primary dark:text-teal-100">My Courses</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedSemester ? `Showing courses for ${selectedSemester}` : "Select a semester on the dashboard to filter courses"}
                        </p>
                      </div>
                    </div>
                  <button
                    onClick={() => setIsAddSemesterOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:bg-accent/90 transition-colors shadow-md shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Semester
                  </button>
                </div>

                {/* MongoDB Syllabus Sync Banner */}
                {dbSemesters.length === 0 && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider">MongoDB Not Seeded</h4>
                      <p className="text-[11px] opacity-90 leading-relaxed max-w-xl">
                        The MongoDB database does not contain any semesters. You can migrate the pre-defined local B.Sc. in CSE course syllabus directly to your MongoDB instance.
                      </p>
                    </div>
                    <Button
                      onClick={handleSyncSyllabus}
                      disabled={isSyncing}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 shadow-md cursor-pointer"
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Syncing...
                        </>
                      ) : syncSuccess ? (
                        "Synced!"
                      ) : (
                        "Sync to MongoDB"
                      )}
                    </Button>
                  </div>
                )}

                {/* Semester pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "1st Year 1st Semester", "1st Year 2nd Semester",
                    "2nd Year 3rd Semester", "2nd Year 4th Semester",
                    "3rd Year 5th Semester", "3rd Year 6th Semester",
                    "4th Year 7th Semester", "4th Year 8th Semester",
                  ].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(selectedSemester === sem ? null : sem)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                        selectedSemester === sem
                          ? "bg-accent text-accent-foreground border-accent shadow-sm"
                          : "border-border text-muted-foreground hover:border-accent/50 hover:text-primary"
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>

                <div className="bg-white dark:bg-[#0b1d1a] rounded-3xl border border-border shadow-sm overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="col-span-1">#</span>
                    <span className="col-span-2">Code</span>
                    <span className="col-span-4">Topic Title</span>
                    <span className="col-span-2">Dept</span>
                    <span className="col-span-2">Credits</span>
                    <span className="col-span-1">Notes</span>
                  </div>

                  {activeSemesterCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                      <BookOpenCheck className="w-10 h-10 text-muted-foreground/30" />
                      <div>
                        <p className="text-sm font-bold text-primary dark:text-teal-200">
                          {selectedSemester ? "No courses added yet" : "No semester selected"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedSemester ? "Click \"Add Semester\" to add courses" : "Pick a semester pill above"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {activeSemesterCourses.map((course, idx) => {
                        const colors = ["bg-blue-500","bg-amber-500","bg-emerald-500","bg-purple-500","bg-rose-500","bg-teal-500"];
                        return (
                          <div
                            key={idx}
                            role="button"
                            tabIndex={0}
                            onClick={() => openCourseFiles(course)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openCourseFiles(course);
                              }
                            }}
                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          >
                            <span className="col-span-1 text-[10px] font-mono text-muted-foreground">{idx + 1}</span>
                            <div className="col-span-2 flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg ${colors[idx % colors.length]} text-white flex items-center justify-center font-bold text-[9px] shrink-0`}>
                                {course.code.split("-")[0]}
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">{course.code}</span>
                            </div>
                            <div className="col-span-4 flex flex-col rounded-xl px-2 py-1.5 -mx-2 -my-1.5 hover:bg-accent/5 transition-colors">
                              <span className="text-xs font-bold text-primary dark:text-teal-200 leading-tight">{course.title}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">{course.code}</span>
                              {course.instructor && <p className="text-[9px] text-muted-foreground mt-0.5">{course.instructor}</p>}
                            </div>
                            <span className="col-span-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">{course.department}</span>
                            </span>
                            <span className="col-span-2 text-xs font-bold text-muted-foreground">{course.creditHours} cr/wk</span>
                            <div className="col-span-1">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  // Set active course filter so Files tab auto-filters & sorts by this course
                                  setActiveCourseFilter({ code: course.code, title: course.title });
                                  // Reset other filters to avoid conflicts
                                  setSelectedFolder(null);
                                  setSelectedCourse("All");
                                  setSelectedType("All");
                                  setSearchQuery("");
                                  clearFolderSelection();
                                  setSelectedYear(
                                    selectedSemester?.startsWith("1st") ? "1st Year" :
                                    selectedSemester?.startsWith("2nd") ? "2nd Year" :
                                    selectedSemester?.startsWith("3rd") ? "3rd Year" : "4th Year"
                                  );
                                  setActiveTab("files");
                                }}
                                className="flex items-center gap-1 text-[9px] font-bold text-accent hover:text-primary transition-colors group/fb"
                              >
                                <Folder className="w-3 h-3 text-amber-500 group-hover/fb:scale-110 transition-transform" />
                                Files
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= VIEW: SETTINGS ================= */}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-2xl mx-auto bg-white dark:bg-[#0b1d1a] p-8 rounded-3xl border border-border shadow-sm flex flex-col gap-6"
              >
                <div className="border-b border-border pb-4">
                  <h2 className="font-serif text-2xl font-bold text-primary dark:text-teal-150">Portal Settings</h2>
                  <p className="text-xs text-muted-foreground">Manage notifications and dark mode configurations</p>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Theme setting */}
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary dark:text-teal-150">Interface Styling</span>
                      <span className="text-[10px] text-muted-foreground">Switch between light mode and dark mode</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const html = document.documentElement;
                        if (html.classList.contains("dark")) {
                          html.classList.remove("dark");
                        } else {
                          html.classList.add("dark");
                        }
                      }}
                      className="border-border text-xs"
                    >
                      Toggle Dark Mode
                    </Button>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Notification setting */}
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary dark:text-teal-150">Notifications email</span>
                      <span className="text-[10px] text-muted-foreground">Send updates on uploaded documents to email</span>
                    </div>
                    <span className="w-10 h-6 bg-accent rounded-full p-1 cursor-pointer flex justify-end">
                      <span className="w-4 h-4 bg-white rounded-full" />
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ================= MODAL: FILE PREVIEW & DOWNLOAD DETAILS ================= */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        {previewFile && (
          <DialogContent className="max-w-md bg-white dark:bg-[#0b1d1a] border border-border p-6 rounded-3xl">
            <DialogHeader className="gap-2">
              <div className="flex justify-between items-start">
                <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border tracking-wider uppercase ${getBadgeStyles(previewFile.color)}`}>
                  {previewFile.department} • {previewFile.type}
                </span>
              </div>
              <DialogTitle className="font-serif text-lg font-bold text-primary dark:text-teal-150 leading-snug">
                {previewFile.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold">
                {previewFile.subject} • {previewFile.size}
              </DialogDescription>
            </DialogHeader>

            {/* Google Drive Mock Thumbnail */}
            <div className="relative aspect-[16/10] w-full rounded-2xl border border-border/60 bg-slate-50 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center" style={{ backgroundImage: "url('/campus_hero.png')" }} />
              
              {/* Actual Google Drive Image CDN Thumbnail */}
              <span className="relative z-10 text-[10px] font-bold uppercase tracking-wider font-mono">
                  {previewFile.subject} • {previewFile.size}
                </span>
            </div>

            <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground py-2 border-t border-b border-border/50 my-2">
              <div className="flex justify-between">
                <span>File Size:</span>
                <span className="font-mono font-bold text-primary dark:text-teal-200">{previewFile.size || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span>Google Drive ID:</span>
                <span className="font-mono truncate max-w-[200px]">{previewFile.driveId}</span>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-3 mt-4 pt-0">
              <Button
                variant="outline"
                onClick={() => setPreviewFile(null)}
                className="border-border text-xs rounded-xl"
              >
                Close Preview
              </Button>
              <a
                href={`https://drive.google.com/file/d/${previewFile.driveId}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-4 py-2 text-xs rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                View & Download
              </a>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ================= MODAL: AUTHENTICATION (SIGN IN / SIGN UP) ================= */}
      {/* ================= MODAL: AUTHORIZATION GATE ================= */}
      <Dialog open={isAuthCheckOpen} onOpenChange={(open) => { setIsAuthCheckOpen(open); if (!open) setAuthCheckDenied(false); }}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#0b1d1a] border border-border p-0 rounded-3xl overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-accent via-teal-400 to-accent/60" />

          <div className="p-7 flex flex-col items-center text-center gap-5">
            {!authCheckDenied ? (
              <>
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-accent" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="font-serif text-xl font-extrabold text-primary dark:text-teal-100">
                    Are You Authorized?
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                    Only authorized personnel can upload notes and study resources to the MY FEC portal.
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-1">
                  {/* No button */}
                  <button
                    onClick={() => setAuthCheckDenied(true)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-border font-bold text-sm text-muted-foreground hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                  >
                    No
                  </button>

                  {/* Yes button */}
                  <button
                    onClick={() => {
                      setIsAuthCheckOpen(false);
                      setAuthCheckDenied(false);
                      if (currentUser) {
                        setIsContributeOpen(true);
                      } else {
                        setAuthMode("signin");
                        setAuthError(null);
                        setIsAuthOpen(true);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent/90 font-bold text-sm text-accent-foreground shadow-md hover:shadow-accent/30 transition-all cursor-pointer"
                  >
                    Yes
                  </button>
                </div>
              </>
            ) : (
              /* Denied message */
              <>
                <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                  <ShieldX className="w-8 h-8 text-rose-500" />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-serif text-lg font-bold text-primary dark:text-teal-100">
                    Access Restricted
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Contact Authorized personnel to contribute notes with{" "}
                    <span className="font-bold text-accent">MY FEC</span>
                  </p>
                </div>

                <button
                  onClick={() => { setIsAuthCheckOpen(false); setAuthCheckDenied(false); }}
                  className="w-full py-2.5 rounded-xl border border-border font-bold text-xs text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer mt-1"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: AUTH (Sign In / Sign Up) ================= */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#0b1d1a] border border-border p-6 rounded-3xl">
          <DialogHeader className="gap-1 pb-2 border-b border-border/50">
            <DialogTitle className="font-serif text-lg font-bold text-primary dark:text-teal-155">
              {authMode === "signin" ? "Student Sign In" : "Register Student Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {authMode === "signin"
                ? "Enter your email and password to log in to your Academic Portal."
                : "Create a new portal account using your email address."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAuth} className="flex flex-col gap-4 py-4">
            {authError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
                {authError}
              </div>
            )}

            {authMode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <Input
                  type="text"
                  required
                  placeholder="Rebecca McDonald"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="rounded-xl border-border bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <Input
                type="email"
                required
                placeholder="rebecca@fec.edu"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="rounded-xl border-border bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="rounded-xl border-border bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "signin" ? "signup" : "signin");
                  setAuthError(null);
                }}
                className="text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                {authMode === "signin"
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
              </button>

              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 rounded-xl text-xs w-full sm:w-auto shadow-sm"
              >
                {authMode === "signin" ? "Sign In" : "Register"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: CONTRIBUTE RESOURCE FORM ================= */}
      <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#0b1d1a] border border-border p-6 rounded-3xl">
          <DialogHeader className="gap-1 pb-2 border-b border-border/50">
            <DialogTitle className="font-serif text-lg font-bold text-primary dark:text-teal-150">
              Contribute Learning Resources
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Share Google Drive links to study materials or previous question sheets with other students.
            </DialogDescription>
          </DialogHeader>

          {isSubmitSuccess ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-md font-bold text-primary dark:text-teal-150">Thank you for sharing!</h4>
              <p className="text-xs text-muted-foreground">
                Your file has been added and categorized in the platform database.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContributeSubmit} className="flex flex-col gap-4 mt-3">
              {/* Field: Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Title</label>
                <Input
                  required
                  placeholder="e.g. Data Structures — Lecture Notes, Week 5"
                  value={newFileTitle}
                  onChange={(e) => setNewFileTitle(e.target.value)}
                  className="h-10 text-xs border-border rounded-xl"
                />
              </div>

              {/* Field: Subject/Folder Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject / Folder</label>
                {folders.length === 0 ? (
                  <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-3">
                    No folders exist. Please create a folder first as an authorized admin.
                  </div>
                ) : (
                  <select
                    required
                    value={newFileSubject}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setNewFileSubject(selectedName);
                      // Match department, year, and color from the folder if it exists
                      const folder = folders.find((f) => f.name === selectedName);
                      if (folder) {
                        setNewFileDept(folder.department);
                        setNewFileYear(folder.year);
                      }
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                  >
                    <option value="">— Select a folder —</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name} ({f.department} · {f.year})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grid: Dept & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</label>
                  <select
                    value={newFileDept}
                    onChange={(e) => setNewFileDept(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                  >
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Year/Sem</label>
                  <select
                    value={newFileYear}
                    onChange={(e) => setNewFileYear(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Grid: Type & Uploader */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resource Type</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                  >
                    <option value="Notes">Notes</option>
                    <option value="Questions">Question Paper</option>
                    <option value="Hand Note">Hand Note</option>
                    <option value="Others Campus Note">Others Campus Note</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Name</label>
                  <Input
                    placeholder="Rebecca McDonald"
                    value={currentUser ? (currentUser.displayName || currentUser.email || "") : newFileUploader}
                    onChange={(e) => setNewFileUploader(e.target.value)}
                    disabled={!!currentUser}
                    className="h-10 text-xs border-border rounded-xl bg-slate-50 dark:bg-slate-900 disabled:opacity-75"
                  />
                </div>
              </div>

              {/* Field: Google Drive URL/ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Google Drive Link or File ID</label>
                <Input
                  required
                  placeholder="https://drive.google.com/file/d/FILE_ID/view"
                  value={newFileDriveId}
                  onChange={(e) => setNewFileDriveId(e.target.value)}
                  className="h-10 text-xs border-border rounded-xl"
                />
                <span className="text-[10px] text-muted-foreground leading-relaxed">
                  Make sure your file's Google Drive link share setting is set to <strong>"Anyone with the link can view"</strong>.
                </span>
              </div>

              <DialogFooter className="mt-4 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsContributeOpen(false)}
                  className="border-border text-xs rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs rounded-xl h-10"
                >
                  Submit Resource
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Add Semester Dialog ─────────────────────────────────────── */}
      <Dialog open={isAddSemesterOpen} onOpenChange={(open) => { setIsAddSemesterOpen(open); if (!open) { setAddSemSuccess(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-white dark:bg-[#0b1d1a]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-primary dark:text-teal-100">
              {addSemSuccess ? "Saved!" : "Add / Edit Semester"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Save a semester and its courses to the database. Pre-filled if a semester is already selected.
            </DialogDescription>
          </DialogHeader>

          {addSemSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-accent" />
              </div>
              <p className="text-sm font-bold text-primary dark:text-teal-200">Semester saved to database!</p>
              <p className="text-xs text-muted-foreground">The courses are now live in the portal.</p>
            </div>
          ) : (
            <form onSubmit={handleAddSemester} className="flex flex-col gap-5 mt-2">

              {/* Semester Label */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Semester Label</label>
                <select
                  required
                  value={addSemLabel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAddSemLabel(val);
                    const semMap: Record<string, { year: string; num: number }> = {
                      "1st Year 1st Semester": { year: "1st Year", num: 1 },
                      "1st Year 2nd Semester": { year: "1st Year", num: 2 },
                      "2nd Year 3rd Semester": { year: "2nd Year", num: 3 },
                      "2nd Year 4th Semester": { year: "2nd Year", num: 4 },
                      "3rd Year 5th Semester": { year: "3rd Year", num: 5 },
                      "3rd Year 6th Semester": { year: "3rd Year", num: 6 },
                      "4th Year 7th Semester": { year: "4th Year", num: 7 },
                      "4th Year 8th Semester": { year: "4th Year", num: 8 },
                    };
                    if (semMap[val]) { setAddSemYear(semMap[val].year); setAddSemNumber(semMap[val].num); }
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                >
                  <option value="">— Select a semester —</option>
                  {["1st Year 1st Semester","1st Year 2nd Semester","2nd Year 3rd Semester","2nd Year 4th Semester","3rd Year 5th Semester","3rd Year 6th Semester","4th Year 7th Semester","4th Year 8th Semester"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Courses */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Courses</label>
                  <button
                    type="button"
                    onClick={() => setAddSemCourses((prev) => [...prev, { code: "", title: "", department: "CSE", creditHours: 3, instructor: "" }])}
                    className="flex items-center gap-1 text-[10px] font-bold text-accent hover:text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Course
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                  {addSemCourses.map((course, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-border bg-slate-50/60 dark:bg-slate-900/40 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Course {idx + 1}</span>
                        {addSemCourses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setAddSemCourses((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Code</label>
                          <Input
                            placeholder="e.g. CS-201"
                            value={course.code}
                            onChange={(e) => setAddSemCourses((prev) => prev.map((c, i) => i === idx ? { ...c, code: e.target.value } : c))}
                            className="h-8 text-xs border-border rounded-lg"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Department</label>
                          <select
                            value={course.department}
                            onChange={(e) => setAddSemCourses((prev) => prev.map((c, i) => i === idx ? { ...c, department: e.target.value } : c))}
                            className="bg-white dark:bg-slate-900 border border-border rounded-lg px-2 text-xs font-semibold text-primary dark:text-teal-200 h-8 cursor-pointer"
                          >
                            <option>CSE</option><option>EEE</option><option>Civil</option><option>Mechanical</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Course Title</label>
                        <Input
                          placeholder="e.g. Data Structures & Algorithms"
                          value={course.title}
                          onChange={(e) => setAddSemCourses((prev) => prev.map((c, i) => i === idx ? { ...c, title: e.target.value } : c))}
                          className="h-8 text-xs border-border rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Credit Hours</label>
                          <Input
                            type="number"
                            min={1} max={6}
                            value={course.creditHours}
                            onChange={(e) => setAddSemCourses((prev) => prev.map((c, i) => i === idx ? { ...c, creditHours: Number(e.target.value) } : c))}
                            className="h-8 text-xs border-border rounded-lg"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Instructor (optional)</label>
                          <Input
                            placeholder="e.g. Dr. Smith"
                            value={course.instructor ?? ""}
                            onChange={(e) => setAddSemCourses((prev) => prev.map((c, i) => i === idx ? { ...c, instructor: e.target.value } : c))}
                            className="h-8 text-xs border-border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSemesterOpen(false)}
                  className="border-border text-xs rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addSemLoading || !addSemLabel}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs rounded-xl h-10 min-w-[120px]"
                >
                  {addSemLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </span>
                  ) : "Save to Database"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Add Folder Dialog ─────────────────────────────────────── */}
      <Dialog open={isAddFolderOpen} onOpenChange={(open) => { setIsAddFolderOpen(open); if (!open) setAddFolderSuccess(false); }}>
        <DialogContent className="max-w-md bg-white dark:bg-[#0b1d1a] border border-border p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-primary dark:text-teal-100">
              {addFolderSuccess ? "Saved!" : "Create Academic Folder"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Save a new folder/subject with classification details directly to the database.
            </DialogDescription>
          </DialogHeader>

          {addFolderSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8 text-accent" />
              </div>
              <p className="text-sm font-bold text-primary dark:text-teal-200">Folder saved to database!</p>
              <p className="text-xs text-muted-foreground">You can now associate documents with this folder.</p>
            </div>
          ) : (
            <form onSubmit={handleAddFolder} className="flex flex-col gap-4 mt-2">
              {/* Folder Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Folder / Subject Name</label>
                <Input
                  required
                  placeholder="e.g. PSY. Midterm or Class Notes for CRT"
                  value={addFolderLabel}
                  onChange={(e) => setAddFolderLabel(e.target.value)}
                  className="h-10 text-xs border-border rounded-xl"
                />
              </div>

              {/* Dept & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</label>
                  <select
                    value={addFolderDept}
                    onChange={(e) => setAddFolderDept(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                  >
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Year</label>
                  <select
                    value={addFolderYear}
                    onChange={(e) => setAddFolderYear(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Color Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accent Color</label>
                <select
                  value={addFolderColor}
                  onChange={(e) => setAddFolderColor(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-2.5 font-semibold text-xs text-primary dark:text-teal-200 cursor-pointer h-10"
                >
                  <option value="blue">Blue</option>
                  <option value="yellow">Yellow/Amber</option>
                  <option value="grey">Grey/Slate</option>
                  <option value="red">Red/Rose</option>
                  <option value="green">Green/Emerald</option>
                </select>
              </div>

              <DialogFooter className="mt-4 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddFolderOpen(false)}
                  className="border-border text-xs rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addFolderLoading || !addFolderLabel}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs rounded-xl h-10 min-w-[120px]"
                >
                  {addFolderLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </span>
                  ) : "Save Folder"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameFolderOpen} onOpenChange={(open) => {
        setIsRenameFolderOpen(open);
        if (!open) {
          setRenameFolderId(null);
          setRenameFolderName("");
        }
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-[#0b1d1a] border border-border p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-primary dark:text-teal-100">
              Rename Folder
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the folder name. The folder link stays valid because sharing uses the folder id.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameFolder} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Folder Name</label>
              <Input
                required
                autoFocus
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                className="h-10 text-xs border-border rounded-xl"
              />
            </div>

            <DialogFooter className="mt-2 pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenameFolderOpen(false)}
                className="border-border text-xs rounded-xl h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renameFolderLoading || !renameFolderName.trim()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs rounded-xl h-10 min-w-[120px]"
              >
                {renameFolderLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                  </span>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
