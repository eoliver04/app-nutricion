import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { listAnalyses } from "./storage";
import type { SavedAnalysis } from "./types";

/** Carga los análisis guardados cada vez que la pantalla recibe el foco. */
export function useSavedAnalyses() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const list = await listAnalyses();
    setAnalyses(list);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listAnalyses().then((list) => {
        if (active) {
          setAnalyses(list);
          setIsLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return { analyses, isLoading, reload };
}
