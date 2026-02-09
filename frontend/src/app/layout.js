import "@/styles/bootstrap/core.css";
import "@/styles/bootstrap/theme.css";
import "@/styles/boxicons.css";
import "@/styles/custom.css";

import ScripstLoader from "@/lib/scripts-loader";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ScripstLoader />
      </body>
    </html>
  );
}
