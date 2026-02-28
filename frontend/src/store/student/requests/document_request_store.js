import { create } from "zustand";

const useStudentDocumentRequestStore = create((set, get) => ({
  step: 1,
  document_types: [],
  documents: {},
  delivery_method: "",
  payment_method: "",
  courier_type: {name: "", fee_cents: 0},
  setPaymentMethod: (method) => set({ payment_method: method }),
  clearPaymentMethod: () => set({ payment_method: "" }),
  
  setDeliveryMethod: (method) => set({ delivery_method: method }),
  
  setupCourierType: (courier) => set({ courier_type: courier }),
  
  next: () => {
    const current = get().step;
    if (current === 1 || current == 1.5) {
      set({ step: current + 0.5 });
    } else {
      set({ step: current + 1 });
    }
  },
  
  
  prev: () => {
    const current = get().step;
    if (current === 2 || current === 1.5) {
      set({ step: current - 0.5 });
    } else {
      set({ step: current - 1 });
    }
  },
  
  
  setDocumentTypes: (document_types) => set({ document_types: document_types }),
  
  
  toggleDocument: (document) => {
    const docs = { ...get().documents };
    
    if (docs[document.id]) {
      delete docs[document.id];
    } else {
      docs[document.id] = {...document, document_type_id: document.id, quantity: 1, purpose: "", other_purpose: false, remarks: "", destination: ""};
    }
    set({ documents: docs });
  },
  
  
  updateDocument: (document) => {
    const docs = { ...get().documents };
    
    if (docs[document.id]) {
      docs[document.id] = {...document};
    }
  
    set({ documents: docs });
  }
}))

export default useStudentDocumentRequestStore