import "@/styles/bootstrap/core.css";
import "@/styles/bootstrap/theme.css";
import "@/styles/bootstrap-select.css";
import "@/styles/boxicons.css";
import "@/styles/custom.css";

import ScriptsLoader from "@/lib/scripts-loader";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ScriptsLoader />
      </body>
    </html>
  );
}
