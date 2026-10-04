"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true setelah hidrasi — untuk konten yang bergantung pada waktu/perangkat pengguna. */
export const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
