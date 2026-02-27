"use client";
import Script from "next/script";

export default function ScriptsLoader() {
  return (
    <>
      <Script
        src="/assets/vendor/libs/jquery.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/assets/vendor/libs/bootstrap/bootstrap.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/assets/vendor/libs/bootstrap-select.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/assets/vendor/libs/sweetalert2.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/assets/vendor/libs/dropzone.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/assets/scripts/main.js"
        strategy="beforeInteractive"
      />
    </>
  );
}
