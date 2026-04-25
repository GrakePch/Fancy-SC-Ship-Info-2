import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import vehicleBasicListRaw from "../../data/vehicle-basic-list.json";
import VehicleImage from "../VehicleImage";
import styles from "./GlobalSearch.module.css";

const vehicleBasicList = vehicleBasicListRaw as unknown as SpvVehicleBasic[];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpvVehicleBasic[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t: tv } = useTranslation("vehicle");
  const navigate = useNavigate();

  // Ctrl+K to open, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Debounced search
  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const q = value.trim().toLowerCase();
      if (!q) {
        setResults([]);
        setActiveIndex(0);
        return;
      }
      const matched = vehicleBasicList.filter((s) => {
        const enName = s.Name.toLowerCase();
        const localName = tv(s.ClassName, { defaultValue: s.Name }).toLowerCase();
        return enName.includes(q) || localName.includes(q);
      });
      setResults(matched.slice(0, 20));
      setActiveIndex(0);
    }, 200);
  };

  const handleSelect = (ship: SpvVehicleBasic) => {
    setOpen(false);
    navigate(`/vehicle/${encodeURIComponent(ship.ClassName)}`);
  };

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[activeIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.panel} onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={`${styles.input} ${query ? styles.inputActive : ""}`}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search ships..."
          autoComplete="off"
          spellCheck={false}
        />
        {results.length > 0 && (
          <ul className={styles.resultList}>
            {results.map((s, i) => {
              const localName = tv(s.ClassName, { defaultValue: s.Name });
              const showLocal = localName !== s.Name;
              return (
                <li
                  key={s.ClassName}
                  className={`${styles.resultItem} ${i === activeIndex ? styles.active : ""}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={() => handleSelect(s)}
                >
                  <VehicleImage
                    className={styles.thumb}
                    vehicleClassName={s.ClassName}
                    angle="top"
                    size="xs"
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className={styles.nameBlock}>
                    <span className={styles.shipName}>{showLocal ? localName : s.Name}</span>
                    {showLocal && (
                      <span className={styles.shipNameEn}>{s.Name}</span>
                    )}
                  </div>
                  {s.Store.Buy != null
                    ? <span className={styles.price}>{s.Store.Buy} <span className={styles.priceUnit}>USD</span></span>
                    : <span className={styles.priceNull}>暂无定价</span>
                  }
                </li>
              );
            })}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <div className={styles.empty}>No results</div>
        )}
      </div>
    </div>
  );
}
