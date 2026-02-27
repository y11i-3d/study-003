import { useEffect } from "react";

export const UiController = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "d":
          document.documentElement.classList.toggle("hide-ui");
          break;
        case "c":
          document.documentElement.classList.toggle("hide-controls");
          break;
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (!params.has("dev")) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
};
