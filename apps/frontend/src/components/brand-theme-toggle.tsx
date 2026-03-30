"use client";

import { PaletteIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BrandTheme = "cobalt" | "lagoon" | "ember";

const themes: Array<{
  value: BrandTheme;
  label: string;
  swatch: string;
}> = [
  { value: "cobalt", label: "Cobalt", swatch: "bg-[#2563eb]" },
  { value: "lagoon", label: "Lagoon", swatch: "bg-[#0f766e]" },
  { value: "ember", label: "Ember", swatch: "bg-[#ea580c]" },
];

const storageKey = "rands-brand-theme";

function resolveTheme(): BrandTheme {
  if (typeof window === "undefined") {
    return "cobalt";
  }

  const storedTheme = window.localStorage.getItem(storageKey) as BrandTheme | null;

  return storedTheme && themes.some((theme) => theme.value === storedTheme)
    ? storedTheme
    : "cobalt";
}

export function BrandThemeToggle({ compact = false }: { compact?: boolean }) {
  const activeTheme = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const handler = () => onStoreChange();

      window.addEventListener("storage", handler);
      window.addEventListener("rands-theme-change", handler);

      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("rands-theme-change", handler);
      };
    },
    resolveTheme,
    () => "cobalt",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-brand", activeTheme);
  }, [activeTheme]);

  function applyTheme(theme: BrandTheme) {
    window.localStorage.setItem(storageKey, theme);
    document.documentElement.setAttribute("data-brand", theme);
    window.dispatchEvent(new Event("rands-theme-change"));
  }

  if (compact) {
    return (
      <div className="surface-muted flex items-center gap-1 rounded-full border px-1 py-1">
        {themes.map((theme) => (
          <button
            key={theme.value}
            type="button"
            aria-label={`Switch brand theme to ${theme.label}`}
            onClick={() => applyTheme(theme.value)}
            className={cn(
              "size-7 rounded-full border border-white/40 transition-transform",
              theme.swatch,
              activeTheme === theme.value ? "scale-110" : "opacity-70",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.6rem] border bg-background/70 p-4">
      <div className="flex items-center gap-2">
        <PaletteIcon className="size-4 text-primary" />
        <div>
          <p className="text-sm font-medium">Brand theme</p>
          <p className="text-sm text-muted-foreground">Swap the accent system without repainting the app.</p>
        </div>
      </div>

      <div className="grid gap-2">
        {themes.map((theme) => (
          <Button
            key={theme.value}
            type="button"
            variant={activeTheme === theme.value ? "default" : "outline"}
            className="justify-between rounded-[1rem]"
            onClick={() => applyTheme(theme.value)}
          >
            <span>{theme.label}</span>
            <span className={cn("size-4 rounded-full", theme.swatch)} />
          </Button>
        ))}
      </div>
    </div>
  );
}
