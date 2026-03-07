import Link from "next/link";
import { notFound } from "next/navigation";
import { PROGRAM_OPTIONS } from "../../program-options";

const VALID_CATEGORIES = new Set(["college", "shs"]);

export default async function StudentListProgramPage({ params }) {
  const { category, program_id: programId } = await params;

  if (!VALID_CATEGORIES.has(category)) {
    notFound();
  }

  const program = PROGRAM_OPTIONS.find((item) => item.id === programId && item.category === category);

  if (!program) {
    notFound();
  }

  return (
    <div className="flex-grow-1 py-4">
      <div className="card border-0 bg-transparent shadow-none" style={{ borderRadius: "0" }}>
        <div className="card-body p-4 p-md-5">
          <div className="mb-4">
            <Link href={`/staff/dashboard/student-list?category=${category}`} className="text-decoration-none fw-semibold">
              Back to Student List
            </Link>
          </div>

          <h3 className="fw-bold text-dark mb-2">{program.label}</h3>
          <p className="text-muted m-0">Table page scaffold. Use category and program ID params here for backend filtering.</p>
          <p className="text-muted mt-2 mb-0">
            Category: <code>{category}</code>
          </p>
          <p className="text-muted mt-1 mb-0">
            Program ID: <code>{programId}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
