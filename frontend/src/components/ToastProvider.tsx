"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      duration={3000}
      toastOptions={{ style: { fontSize: "14px" } }}
    />
  );
}
