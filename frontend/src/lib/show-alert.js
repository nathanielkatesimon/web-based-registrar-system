export default function ShowAlert({ icon, title, text, ...options }) {
  const Swal = typeof window !== "undefined" ? window.Swal : null;
  if (Swal?.fire) {
    return Swal.fire({
      icon,
      title,
      text,
      showCancelButton: false,
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "btn btn-primary",
        cancelButton: "btn btn-outline-secondary ms-2",
      },
      showClass: {
        popup: "animate__animated animate__bounceIn",
      },
      ...options,
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
