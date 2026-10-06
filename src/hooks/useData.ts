import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
export type Resource<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
};
export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
): Resource<T> {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: boolean;
  }>({ data: null, loading: true, error: false });
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let active = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    load(controller.signal)
      .then((data) => {
        if (active) setState({ data, loading: false, error: false });
      })
      .catch(() => {
        if (active) setState((s) => ({ ...s, loading: false, error: true }));
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [load, attempt]);
  return { ...state, retry: () => setAttempt((x) => x + 1) };
}
export function useStaticData<T>(file: string, schema: z.ZodType<T>) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const response = await fetch(
        `${import.meta.env.BASE_URL}data/${file}.json`,
        {
          signal,
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
        },
      );
      if (!response.ok) throw new Error("Andmed pole saadaval");
      return schema.parse(await response.json());
    },
    [file, schema],
  );
  return useResource(load);
}
