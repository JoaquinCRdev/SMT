import { useEffect } from "react";

const useApplyTheme = () => {
  useEffect(() => {
    let oscuro = true;

    try {
      const saved = localStorage.getItem("mode");
      oscuro =
        saved !== null
          ? JSON.parse(saved)
          : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);
    } catch {
      oscuro = true;
    }

    document.body.classList.toggle("light-mode", !oscuro);
    document.body.classList.toggle(
      "tamano-grande",
      localStorage.getItem("fontSize") === "grande",
    );
  }, []);
};

export default useApplyTheme;