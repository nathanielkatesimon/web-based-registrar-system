"use client"

export default function PasswordValidator({ password = "", password_confirmation = "" }) {
  const shouldValidate = password.length > 0 || password_confirmation.length > 0;
  const error = getPasswordValidationError(password, password_confirmation);

  if (!shouldValidate || !error) {
    return null;
  }

  return <div className="d-block invalid-feedback">{error}</div>;
}

export function getPasswordValidationError(password, passwordConfirmation) {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least 1 number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least 1 special character.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least 1 uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least 1 lowercase letter.";
  }

  if (passwordConfirmation && password !== passwordConfirmation) {
    return "Passwords do not match.";
  }

  return "";
}
