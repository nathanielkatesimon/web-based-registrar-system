import Image from "next/image";

export default function AuthCard({ children }) {
  return (
    <div
      className="card overflow-hidden rounded-rem-1 w-100"
      style={{
        minWidth: 412,
        maxWidth: 498,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
      }}
    >
      <div className="gradient-bar" style={{ height: 22 }}></div>
      <div className="w-100 d-flex flex-column align-items-center">
        <Image src="/icon.png" width={153} height={153} alt="icon" />
        <p className="m-0 text-black">ACLC College of Ormoc</p>
        <h3 className="m-0 fw-semibold text-black">E-Registrar</h3>
      </div>
      <div className="card-body pb-11">{children}</div>
    </div>
  );
}
