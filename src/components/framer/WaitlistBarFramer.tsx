import React, { useEffect, useState } from "react";

type Props = {
  apiUrl?: string;
  placeholder?: string;
  buttonText?: string;
};

export default function WaitlistBarFramer({
  apiUrl = "/api/waitlist",
  placeholder = "Enter your email",
  buttonText = "Join waitlist",
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Load Inter from Google Fonts for Framer preview parity
  useEffect(() => {
    const id = "framer-inter-googlefont";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  const validateEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateEmail(email)) {
      setStatus("error");
      setMessage("Please enter a valid email");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Thanks — check your email to confirm");
        setEmail("");
      } else {
        const j = await res.json().catch(() => null);
        setStatus("error");
        setMessage((j && (j.error || j.message)) || "Server error");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error");
    }
  };

  const container: React.CSSProperties = {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system",
    display: "flex",
    alignItems: "center",
    gap: 12,
    height: 60,
    padding: "0 16px",
    borderRadius: 999,
    background: "#FFFFFF",
    boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
    maxWidth: 720,
    width: "100%",
    boxSizing: "border-box",
    flexWrap: "wrap",
  };

  const input: React.CSSProperties = {
    flex: 1,
    minWidth: 180,
    height: 40,
    border: "1px solid #e6e6e6",
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 16,
    outline: "none",
  };

  const button: React.CSSProperties = {
    height: 44,
    minWidth: 120,
    padding: "0 16px",
    borderRadius: 8,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    fontWeight: 700,
    cursor: status === "loading" ? "wait" : "pointer",
    whiteSpace: "nowrap", // ensures single-line button text
  };

  const msgStyle: React.CSSProperties = {
    width: "100%",
    marginTop: 6,
    color: status === "error" ? "#b00020" : "#0b6f4b",
    fontSize: 13,
  };

  return (
    <form onSubmit={submit} style={{ width: "100%" }}>
      <div style={container}>
        <input
          aria-label="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <button type="submit" style={button} disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : buttonText}
        </button>

        <div style={{ width: 12 }} />

        {status !== "idle" && <div style={{ fontSize: 13 }}>{/* small spacer for message */}</div>}
      </div>

      {message && <div style={msgStyle}>{message}</div>}
    </form>
  );
}
