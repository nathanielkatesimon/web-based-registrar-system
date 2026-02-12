import Image from "next/image";

export default function RegisterCard(props) {
  return (
    <div
      className="card overflow-hidden rounded-rem-1 w-100"
      style={{
        minWidth: 412,
        maxWidth: 1232,
        height: 800,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
      }}
    >
      <div className="card-body d-flex p-0">
        <div className="w-100 w-md-50">{props.children}</div>
        <div className="d-none d-md-block overflow-hidden position-relative">
          <div className="position-absolute z-1 text-end w-100 bottom-0 p-12">
            <h2 className="m-0 fw-semibold text-white">Manage Requests</h2>
            <h2 className="m-0 fw-semibold text-white">Efficiently.</h2>
            <p className="m-0 fw-semibold text-white fs-5">
              Monitor, process, and update user document
            </p>
            <p className="m-0 fw-semibold text-white fs-5">
              requests in one centralized system.
            </p>
          </div>
          <Image
            alt="tab"
            src={props.image}
            className="w-100 staff_create_account_background"
            width={616}
            height={823}
          />
        </div>
      </div>
    </div>
  );
}
