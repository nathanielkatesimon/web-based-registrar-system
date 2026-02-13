import Link from "next/link";

export default function Home() {
  return (
    <div className="p-12">
      <Link href="/staff/login" className="text-info d-block fs-4 mb-12">Staff Login</Link>
      <Link href="/staff/register" className="text-info d-block fs-4 mb-12">Staff Register</Link>
      <Link href="/student/login" className="text-info d-block fs-4 mb-12">Student Login</Link>
      <Link href="/student/register" className="text-info d-block fs-4 mb-12">Student Register</Link>
    </div>
  );
}
