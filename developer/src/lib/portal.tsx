import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "../components/Icon";

export type Env = "test" | "live";
export type Tone = "default" | "success" | "danger";

type ToastItem = { id: number; text: string; detail?: string; tone: Tone };

type PortalValue = {
  env: Env;
  setEnv: (env: Env) => void;
  toast: (text: string, detail?: string, tone?: Tone) => void;
};

const PortalContext = createContext<PortalValue | null>(null);

let nextId = 1;

export function PortalProvider({ children }: { children: ReactNode }) {
  const [env, setEnvState] = useState<Env>("test");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((text: string, detail?: string, tone: Tone = "default") => {
    const id = nextId++;
    setToasts((items) => [...items, { id, text, detail, tone }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const setEnv = useCallback((next: Env) => setEnvState(next), []);

  const value = useMemo(() => ({ env, setEnv, toast }), [env, setEnv, toast]);

  return (
    <PortalContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-end gap-2 p-4 sm:p-6"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="animate-toast pointer-events-auto flex w-full max-w-[340px] items-start gap-2.5 rounded-xl bg-ink px-3.5 py-3 text-white shadow-lift"
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                item.tone === "danger"
                  ? "bg-danger"
                  : item.tone === "success"
                    ? "bg-success"
                    : "bg-white/15"
              }`}
            >
              <Icon name={item.tone === "danger" ? "alert" : "check"} size={12} strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold leading-snug">{item.text}</span>
              {item.detail ? (
                <span className="mt-0.5 block text-[11.5px] leading-snug text-white/60">
                  {item.detail}
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </PortalContext.Provider>
  );
}

export function usePortal(): PortalValue {
  const value = useContext(PortalContext);
  if (!value) throw new Error("usePortal must be used inside PortalProvider");
  return value;
}
