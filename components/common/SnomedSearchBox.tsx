"use client";
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { searchSnomed } from "@/lib/snomed/search";

type Props = {
  semantictag: "finding" | "disorder" | "procedure" | "specimen";
  onSelect: (item: { term: string; conceptId: string }) => void;
  placeholder?: string;
};

const SnomedSearchBox = forwardRef<HTMLInputElement, Props>(
  ({ semantictag, onSelect, placeholder }, ref) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const listRef = useRef<HTMLUListElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose focus handle to parent (DigitalRxForm)
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleSelect = (item: any) => {
      onSelect({ term: item.term, conceptId: item.conceptId });
      setQuery(""); // clear input
      setResults([]); // close dropdown
      setHighlight(0); // reset highlight
      inputRef.current?.focus(); // keep focus for next entry
    };

    // fetch results with debounce
    useEffect(() => {
      const t = setTimeout(async () => {
        if (query.length < 2) return setResults([]);
        setLoading(true);
        try {
          const data = await searchSnomed(query, semantictag);
          setResults(data || []);
          setHighlight(0);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
      return () => clearTimeout(t);
    }, [query, semantictag]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % results.length);
        listRef.current?.children[highlight + 1]?.scrollIntoView({
          block: "nearest",
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + results.length) % results.length);
        listRef.current?.children[highlight - 1]?.scrollIntoView({
          block: "nearest",
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = results[highlight];
        if (item) handleSelect(item);
      }
    };

    return (
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Search SNOMED term"}
          className="ui-card w-full rounded p-2 text-sm"
        />
        {loading && (
          <div className="absolute right-2 top-2 text-gray-400 text-xs">...</div>
        )}

        {results.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-10 bg-white border border-gray-200 w-full rounded shadow max-h-60 overflow-auto"
          >
            {results.map((r, i) => (
              <li
                key={i}
                onMouseDown={() => handleSelect(r)}
                className={`px-2 py-1 cursor-pointer text-sm ${
                  i === highlight ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                {r.term}{" "}
                <span className="text-gray-400 text-xs">({r.conceptId})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

export default SnomedSearchBox;
