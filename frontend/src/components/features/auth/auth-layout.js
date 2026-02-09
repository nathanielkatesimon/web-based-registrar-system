import Image from "next/image";

export default function AuthLayout({children}) {
  return (
    <div className="d-flex flex-column align-items-center">
      <Image
        alt="Background"
        width={1200}
        height={853}
        src="/bg.png"
        style={{ zIndex: -1 }}
        className="w-lg-100 h-100 position-fixed"
      />
      <div
        className="w-100 h-100 position-fixed"
        style={{ backgroundColor: "black", opacity: 0.54, zIndex: -1 }}
      ></div>
      {children}
    </div>
  );
}
