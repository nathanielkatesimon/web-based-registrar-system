export default function ShowAlert ({ icon, title, text }){
  const Swal = typeof window !== "undefined" ? window.Swal : null;
  if (Swal?.fire) {
    return Swal.fire({
      icon,
      title,
      text,
      customClass: {
        confirmButton: 'btn btn-primary',
      },
      showClass: {
        popup: 'animate__animated animate__bounceIn'
      },
    });
  }

  if (typeof window !== "undefined") {
    window.alert(text || title);
  }
};