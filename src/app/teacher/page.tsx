import Link from "next/link";
import TeacherDashboard from "@/components/TeacherDashboard";

export default function TeacherPage() {
  return <>
    <nav className="teacher-nav"><Link href="/">← Back to learner view</Link></nav>
    <TeacherDashboard />
  </>;
}
