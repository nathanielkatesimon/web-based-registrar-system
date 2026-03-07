export default function ShowAlert({ icon, title, text, ...options }) {
  const Swal = typeof window !== "undefined" ? window.Swal : null;
  if (Swal?.fire) {
    return Swal.fire({
      icon,
      title,
      text,
      showCancelButton: false,
      confirmButtonText: "OK",
      showClass: {
        popup: "animate__animated animate__bounceIn",
      },
      ...options,
      customClass: {
        title: "m-0 p-4",
        htmlContainer: "m-0 mb-2 px-8 text-muted",
        confirmButton: "btn btn-primary",
        cancelButton: options.showCancelButton ? "btn btn-outline-secondary ms-2" : "d-none",
        ...options.customClass
      },
    });
  }

  if (typeof window !== "undefined") {
    if (options.showCancelButton) {
      const isConfirmed = window.confirm(text || title);
      return Promise.resolve({ isConfirmed });
    }
    window.alert(text || title);
    return Promise.resolve({ isConfirmed: true });
  }
}
