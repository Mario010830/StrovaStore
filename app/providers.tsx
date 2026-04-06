"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";
import { registerCartAbandonmentTracker } from "@/src/metrics/cartAbandonmentTracker";

function MetricsRoot() {
  useEffect(() => {
    registerCartAbandonmentTracker();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <MetricsRoot />
        {children}
      </PersistGate>
    </Provider>
  );
}
