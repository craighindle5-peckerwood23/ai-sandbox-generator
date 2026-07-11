"use client";

import { ReactNode, useEffect, useState } from "react";

export default function ThemeShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <>{children}</>;
  }

  return (
    <div
      className="microfyxd-theme-shell"
      // Put your dynamic theme variables here later
      // style={{ "--color-appBg": "#090e1a" }}
    >
      {children}
    </div>
  );
}