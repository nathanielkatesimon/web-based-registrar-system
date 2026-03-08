function passwordTogglerEventHandler(e) {
  e.preventDefault();
  const formPasswordToggle = e.target.closest(".form-password-toggle");
  const formPasswordToggleIcon = formPasswordToggle.querySelector("i");
  const formPasswordToggleInput = formPasswordToggle.querySelector("input");

  if (formPasswordToggleInput.getAttribute("type") === "text") {
    formPasswordToggleInput.setAttribute("type", "password");
    formPasswordToggleIcon.classList.replace("bx-eye-alt", "bx-eye-slash");
  } else if (formPasswordToggleInput.getAttribute("type") === "password") {
    formPasswordToggleInput.setAttribute("type", "text");
    formPasswordToggleIcon.classList.replace("bx-eye-slash", "bx-eye-alt");
  }
}

window.initPasswordToggler = () => {
  const toggler = document.querySelectorAll(".form-password-toggle i");

  if (typeof toggler !== "undefined" && toggler !== null) {
    toggler.forEach((el) => {
      el.removeEventListener("click", passwordTogglerEventHandler);
      el.addEventListener("click", passwordTogglerEventHandler);
    });
  }
};
