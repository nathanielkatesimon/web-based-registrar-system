import { create } from "zustand";

const useSessionStore = create((set) => ({
  userType: "", // Guess | Student | Staff
  csrfToken: "",
  currentUser: null,
  saveSession: (type, token, user = null) =>
    set((_state) => ({ userType: type, csrfToken: token, currentUser: user })),
  saveCurrentUser: (user) => set((_state) => ({ currentUser: user })),
  resetSession: () => set((_state) => ({ userType: "Guess", csrfToken: "", currentUser: null }))
}))

export default useSessionStore
