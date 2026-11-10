import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

let cache = null;
let cacheTime = 0;
const listeners = new Set();

export function useSubjects() {
  const [subjects, setSubjects] = useState(cache || []);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const l = (s) => { if (mounted.current) setSubjects(s); };
    listeners.add(l);
    if (cache && Date.now() - cacheTime < 60000) {
      setSubjects(cache);
    } else {
      base44.entities.Subject.list()
        .then((s) => {
          cache = s || [];
          cacheTime = Date.now();
          listeners.forEach((x) => x(cache));
        })
        .catch(() => {});
    }
    return () => { mounted.current = false; listeners.delete(l); };
  }, []);

  const refresh = async () => {
    const s = await base44.entities.Subject.list();
    cache = s || [];
    cacheTime = Date.now();
    listeners.forEach((x) => x(cache));
    return cache;
  };

  return { subjects: subjects || [], refresh };
}

export function invalidateSubjects() {
  cache = null;
  cacheTime = 0;
}