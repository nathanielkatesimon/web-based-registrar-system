import Link from "next/link";

const menuItems = [
  { label: "Personal Info", href: "/student/dashboard/profile/personal_info", alert: true, active: true },
  { label: "Family Info", href: "#", alert: true },
  { label: "Academic Info", href: "#", alert: true },
  { label: "Deficiencies", href: "#" },
  { label: "Account", href: "#" },
];

export default function ProfileLayout({ children }) {
  return (
    <div style={{ backgroundColor: "#eef0f6", minHeight: "100vh" }}>
      <div className="container-fluid px-0">
        <div className="d-flex">
          <aside
            style={{ width: "220px", minHeight: "100vh", backgroundColor: "#9bb2e7", borderRight: "1px solid #8da3d4" }}
          >
            <nav>
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`d-flex align-items-center justify-content-between text-decoration-none px-2 py-2 small mb-1 ${
                    item.active ? "text-white fw-semibold" : "text-dark"
                  }`}
                  style={item.active ? { backgroundColor: "#102f95" } : {}}
                >
                  <span>{item.active ? `→ ${item.label}` : item.label}</span>
                  {item.alert ? (
                    <span
                      className="d-inline-flex align-items-center justify-content-center text-white"
                      style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#ef1f23", fontSize: "10px" }}
                    >
                      !
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-grow-1 px-4 py-3">
            <div className="pb-4">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
