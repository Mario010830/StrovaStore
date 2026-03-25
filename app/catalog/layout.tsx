"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { isCatalogIndexPath } from "@/lib/path-utils";

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
  const pathname = usePathname();
  const isCatalogRoot = isCatalogIndexPath(pathname);

  return (
    <CatalogContext.Provider value={{ search, setSearch }}>
      <div className="store-layout">
        <main className={`store-main${isCatalogRoot ? " store-main--flush-x" : ""}`}>{children}</main>
      </div>
    </CatalogContext.Provider>
  );
}
