import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Prompt = {
  id: number;
  text: string;
  favourite?: boolean;
};

const STORAGE_KEY = "prompts";
const THEME_KEY = "theme";

export default function App() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFavourites, setShowFavourites] = useState(false);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === "dark");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // ✅ These refs must be here (top-level in component)
  const scrollYRef = useRef(0);
  const keepScrollRef = useRef(false);

  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Prompt[]) : [];
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, [prompts]);

  useLayoutEffect(() => {
    if (keepScrollRef.current) {
      window.scrollTo({ top: scrollYRef.current, behavior: "auto" });
      keepScrollRef.current = false;
    }
  }, [showFavourites, search]);

  const addPrompt = () => {
  const text = input.trim();
  if (!text) return;

  setPrompts([{ id: Date.now(), text, favourite: false }, ...prompts]);
  setInput("");
};

  const deletePrompt = (id: number) => {
    setPrompts(prompts.filter((p) => p.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditText("");
    }
    if (confirmDeleteId === id) setConfirmDeleteId(null);
  };

  const copyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard failures
    }
  };

  const toggleFavourite = (id: number) => {
    setPrompts(prompts.map((p) => (p.id === id ? { ...p, favourite: !p.favourite } : p)));
  };

  const startEdit = (p: Prompt) => {
    setEditingId(p.id);
    setEditText(p.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = (id: number) => {
    const text = editText.trim();
    if (!text) return;

    setPrompts(prompts.map((p) => (p.id === id ? { ...p, text } : p)));
    setEditingId(null);
    setEditText("");
  };

  const filteredPrompts = useMemo(() => {
    let result = prompts;

    if (showFavourites) result = result.filter((p) => p.favourite);

    const q = search.trim().toLowerCase();
    if (q) result = result.filter((p) => p.text.toLowerCase().includes(q));

    return result;
  }, [prompts, search, showFavourites]);

  return (
    <div className="container">
      <div className="header">
        <h1>Prompt Library</h1>
        <div className="headerActions">
          <button className="btn" type="button" onClick={() => setDarkMode((v) => !v)}>
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>

      <div className="inputRow">
        <textarea
  placeholder="Enter one or multiple prompts (one per line)..."
  value={input}
  onChange={(e) => setInput(e.target.value)}
  rows={4}
/>
        <button className="btn" onClick={addPrompt}>
          Add
        </button>
      </div>

      <div className="filtersRow">
        <input
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn"
          type="button"
          onClick={() => {
            scrollYRef.current = window.scrollY;
            keepScrollRef.current = true;
            setShowFavourites((v) => !v);
          }}
        >
          {showFavourites ? "Show All" : "Show Favourites"}
        </button>
      </div>

      <ul className="promptList">
        {filteredPrompts.map((p) => (
          <li key={p.id} className="promptItem">
            <div className="promptText">
              {editingId === p.id ? (
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(p.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              ) : (
                <div className="promptDisplay">
  <span>{p.favourite ? "⭐ " : ""}</span>
  <span className="promptTextBlock">{p.text}</span>
</div>
              )}
            </div>

            <div className="actions">
              {editingId === p.id ? (
                <>
                  <button className="btn" type="button" onClick={() => saveEdit(p.id)}>
                    Save
                  </button>
                  <button className="btn secondary" type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn" type="button" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn" type="button" onClick={() => toggleFavourite(p.id)}>
                    ⭐
                  </button>
                  <button className="btn" type="button" onClick={() => copyPrompt(p.text)}>
                    Copy
                  </button>

                  {confirmDeleteId === p.id ? (
                    <>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => deletePrompt(p.id)}
                      >
                        Confirm
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn danger"
                      type="button"
                      onClick={() => setConfirmDeleteId(p.id)}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {filteredPrompts.length === 0 && (
        <p style={{ opacity: 0.7, marginTop: 12 }}>No matching prompts.</p>
      )}
    </div>
  );
}