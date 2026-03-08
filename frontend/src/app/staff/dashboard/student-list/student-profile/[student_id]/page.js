import { redirect } from "next/navigation";

export default function StaffStudentProfileIndexPage({ params }) {
  redirect(`/staff/dashboard/student-list/student-profile/${params.student_id}/personal_info`);
}
