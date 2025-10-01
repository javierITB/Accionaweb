"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const UiContext = createContext();

export function UiProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  return (
    <UiContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </UiContext.Provider>
  );
}

export const useUi = () => useContext(UiContext);
