import React from "react";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full">
      <div className="flex w-full">{children}</div>
    </div>
  );
}
