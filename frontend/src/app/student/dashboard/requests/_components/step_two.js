"use client"

import InitDropzone from "@/components/initializer/init-dropzone"

export default function StepTwo() {
  return <div className="p-5">
    <div className="card mx-auto p-12" style={{ maxWidth: 1072 }}>
      
      
      <h4 className="fw-bold text-primary">Attachments<span className="text-danger">*</span></h4>
      <h4 className="text-primary">Upload a photo of you holding any valid ID.</h4>
      <label className="mb-5 text-primary"><strong>Note: </strong>Please make sure the photo / image uploaded is clear.</label>
      <div className="card shadow-none">
        <form action="/upload" className="dropzone needsclick dz-clickable border border-dashed" id="dropzone-basic">
          <div className="dz-message needsclick">
            <i className="bx bx-image fs-1 d-block text-center"></i>
            Drop image or Click to upload
          </div>
        </form>
        <span className="text-secondary">Only png, jpeg, jpg are allowed file types</span>
      </div>


      <InitDropzone />
    </div>
  </div>
}
