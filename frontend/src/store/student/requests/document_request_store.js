import { create } from "zustand";
import { api } from "@/lib/api";

const useStudentDocumentRequestStore = create((set, get) => ({
  step: 1,
  document_types: [],
  documents: {},
  delivery_method: "",
  payment_method: "",
  id_verification_photo: null,
  payment_receipt: null,
  submitted_request: null,
  courier_type: {name: "", fee_cents: 0},
  setPaymentMethod: (method) => set({ payment_method: method }),
  clearPaymentMethod: () => set({ payment_method: "" }),
  setIdVerificationPhoto: (file) => set({ id_verification_photo: file || null }),
  clearIdVerificationPhoto: () => set({ id_verification_photo: null }),
  setPaymentReceipt: (file) => set({ payment_receipt: file || null }),
  clearPaymentReceipt: () => set({ payment_receipt: null }),
  
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

  resetRequestFlow: () => set({
    step: 1,
    documents: {},
    delivery_method: "",
    payment_method: "",
    id_verification_photo: null,
    payment_receipt: null,
    submitted_request: null,
    courier_type: { name: "", fee_cents: 0 }
  }),

  completeSubmission: (submitted_request) => set({
    step: 5,
    submitted_request,
    documents: {},
    delivery_method: "",
    payment_method: "",
    id_verification_photo: null,
    payment_receipt: null,
    courier_type: { name: "", fee_cents: 0 }
  }),
  
  
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
  },

  submitRequest: async () => {
    const state = get();
    const documents = Object.values(state.documents || {});

    const formData = new FormData();
    formData.append("document_request[status]", "on_hold");
    formData.append("document_request[delivery_method]", state.delivery_method);

    if (state.delivery_method === "courier_delivery") {
      formData.append("document_request[courier_name]", state.courier_type?.name || "");
      formData.append("document_request[shipping_fee_cents]", String(state.courier_type?.fee_cents || 0));
    } else {
      formData.append("document_request[shipping_fee_cents]", "0");
    }

    const backendPaymentMethod = state.payment_method === "online" ? "online" : "cash";
    const backendPaymentStatus = backendPaymentMethod === "online" ? "under_review" : "not_paid";

    formData.append("document_request[payment_method]", backendPaymentMethod);
    formData.append("document_request[payment_status]", backendPaymentStatus);
    formData.append("document_request[unpaid_bill]", true);

    if (state.id_verification_photo) {
      formData.append("document_request[id_verification_photo]", state.id_verification_photo);
    }

    if (backendPaymentMethod === "online" && state.payment_receipt) {
      formData.append("document_request[payment_receipt]", state.payment_receipt);
    }

    documents.forEach((document, index) => {
      const quantity = Number.parseInt(document.quantity, 10) || 1;
      const destinationValue = document.destination === "abroad" ? 1 : 0;

      formData.append(
        `document_request[document_request_items_attributes][${index}][document_type_id]`,
        String(document.document_type_id)
      );
      formData.append(
        `document_request[document_request_items_attributes][${index}][quantity]`,
        String(quantity)
      );
      formData.append(
        `document_request[document_request_items_attributes][${index}][purpose]`,
        document.purpose || ""
      );
      formData.append(
        `document_request[document_request_items_attributes][${index}][destination]`,
        String(destinationValue)
      );
      formData.append(
        `document_request[document_request_items_attributes][${index}][remarks]`,
        document.remarks || ""
      );
    });

    return api("/api/v1/document_requests", {
      method: "POST",
      body: formData
    });
  }
}))

export default useStudentDocumentRequestStore
