import "@/styles/bootstrap/core.css";
import "@/styles/bootstrap/theme.css";
import "@/styles/bootstrap-select.css";
import "@/styles/sweetalert2.css";
import "@/styles/animate.css";
import "@/styles/spinkit.css";
import "@/styles/boxicons.css";
import "@/styles/custom.css";
import "@/styles/dropzone.css";
import "cropperjs/dist/cropper.css";

import ScriptsLoader from "@/lib/scripts-loader";
import SessionProvider from "@/components/initializer/session-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light-style layout-navbar-fixed layout-menu-fixed layout-compact">
      <body>
        {children}
        <SessionProvider />
        <ScriptsLoader />
      </body>
    </html>
  );
}
