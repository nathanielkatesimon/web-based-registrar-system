"use client";

import { useEffect } from "react";

const PREVIEW_TEMPLATE = `<div class="dz-preview dz-file-preview">
  <div class="dz-details">
    <div class="dz-thumbnail">
      <img data-dz-thumbnail>
      <span class="dz-nopreview">No preview</span>
      <div class="dz-success-mark"></div>
      <div class="dz-error-mark"></div>
      <div class="dz-error-message"><span data-dz-errormessage></span></div>
      <div class="progress">
        <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuemin="0" aria-valuemax="100" data-dz-uploadprogress></div>
      </div>
    </div>
    <div class="dz-filename" data-dz-name></div>
    <div class="dz-size" data-dz-size></div>
  </div>
  </div>`;

export default function InitDropzone({ elementId = "dropzone-basic", onFileChange }) {
  useEffect(() => {
    let mounted = true;
    let retryTimer = null;
    let myDropzone = null;
    let createdByThisHook = false;

    const handleAddedFile = (file) => {
      if (!myDropzone) return;
      if (myDropzone.files.length > 1) {
        const firstFile = myDropzone.files[0];
        if (firstFile && firstFile !== file) {
          myDropzone.removeFile(firstFile);
        }
      }
      if (onFileChange) onFileChange(file);
    };

    const handleRemovedFile = () => {
      if (onFileChange) onFileChange(null);
    };

    const initialize = () => {
      if (!mounted) return true;

      const dropzoneElement = document.querySelector(`#${elementId}`);
      const DropzoneLib =
        typeof window !== "undefined"
          ? window.Dropzone || (typeof Dropzone !== "undefined" ? Dropzone : null)
          : null;

      if (!dropzoneElement || !DropzoneLib) return false;

      if (dropzoneElement.dropzone) {
        myDropzone = dropzoneElement.dropzone;
      } else {
        myDropzone = new DropzoneLib(dropzoneElement, {
          previewTemplate: PREVIEW_TEMPLATE,
          parallelUploads: 1,
          maxFilesize: 5,
          addRemoveLinks: true,
          maxFiles: 1,
          acceptedFiles: ".png,.jpg,.jpeg"
        });
        createdByThisHook = true;
      }

      myDropzone.on("addedfile", handleAddedFile);
      myDropzone.on("removedfile", handleRemovedFile);

      if (myDropzone.files.length > 0 && onFileChange) {
        onFileChange(myDropzone.files[myDropzone.files.length - 1] || null);
      }

      return true;
    };

    const tryInitialize = (attempt = 0) => {
      const didInitialize = initialize();
      if (didInitialize || !mounted) return;
      if (attempt >= 30) return;
      retryTimer = window.setTimeout(() => tryInitialize(attempt + 1), 100);
    };

    tryInitialize();

    return () => {
      mounted = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (!myDropzone) return;

      myDropzone.off("addedfile", handleAddedFile);
      myDropzone.off("removedfile", handleRemovedFile);

      if (createdByThisHook) {
        myDropzone.destroy();
      }
    };
  }, [elementId, onFileChange]);

  return null;
}
