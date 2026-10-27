/**
 * Plays the rubber-band animation on an icon when the control around it is
 * pressed. Hover is handled in CSS; press needs this because a touchscreen
 * release would otherwise cut the animation off mid-way.
 */
export function installIconRubber() {
  if (typeof document === "undefined") return;

  const onPointerDown = (event: Event) => {
    const target = event.target as Element | null;
    const control = target?.closest?.("button, a, [role='button']");
    if (!control) return;

    const icon = control.querySelector<HTMLElement>(".icon-rubber");
    if (!icon) return;

    icon.classList.remove("is-rubbering");
    // Force a reflow so the animation restarts even on a repeated press.
    void icon.offsetWidth;
    icon.classList.add("is-rubbering");

    icon.addEventListener("animationend", () => icon.classList.remove("is-rubbering"), { once: true });
  };

  document.addEventListener("pointerdown", onPointerDown, { passive: true });
}
