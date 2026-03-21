"use client";

import { createContext, useContext, useState } from "react";

interface CatalogCtx {
  search: string;
  setSearch: (v: string) => void;
}

const CatalogContext = createContext<CatalogCtx>({
  search: "",
  setSearch: () => {},
});

export const useCatalogCtx = () => useContext(CatalogContext);

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");

  return (
    <CatalogContext.Provider value={{ search, setSearch }}>
      <div className="store-layout">
        <main className="store-main">{children}</main>
      </div>
    </CatalogContext.Provider>
  );
}
