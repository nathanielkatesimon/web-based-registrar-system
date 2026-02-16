import { create } from "zustand";

const useSessionStore = create((set) => ({
  userType: "", // Guess | Student | Staff
  csrfToken: "",
  saveSession: (type, token) => set((_state) => ({userType: type, csrfToken: token})),
  resetSession: () => set((_state) => ({userType: "Guess", csrfToken: ""}))
}))

export default useSessionStore