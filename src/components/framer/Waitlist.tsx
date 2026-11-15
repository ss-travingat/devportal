import * as React from "react";

type WaitlistBarProps = {
  apiUrl?: string;
  inputPlaceholder?: string;
  submitLabel?: string;
  loadingLabel?: string;
  showMessage?: boolean;
  onSuccess?: () => void;
};

function useWaitlistForm(apiUrl: string) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const [message, setMessage] = React.useState("");

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const responseText = await res.text();
      let responseMessage = "";
      try {
        const parsed = responseText ? JSON.parse(responseText) : null;
        responseMessage = parsed?.error || parsed?.message || "";
      } catch {
        responseMessage = responseText.trim();
      }

      if (res.status === 409) {
        setStatus("duplicate");
        setMessage("You're already on the waitlist!");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(responseMessage || `Server returned ${res.status}`);
        return;
      }

      setStatus("success");
      setMessage("Check your email to confirm your spot.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? `Request failed: ${error.message}`
          : "Request failed: unable to reach the waitlist API",
      );
    }
  };

  return { email, setEmail, status, message, submit };
}

export default function WaitlistBar({
  apiUrl = "/api/waitlist",
  inputPlaceholder = "Enter your email",
  submitLabel = "Get early access",
  loadingLabel = "Joining...",
  showMessage = true,
  onSuccess,
}: WaitlistBarProps) {
  const { email, setEmail, status, message, submit } = useWaitlistForm(apiUrl);
  const isLoading = status === "loading";
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (status === "success") onSuccess?.();
  }, [onSuccess, status]);

  React.useEffect(() => {
    const id = "framer-inter-googlefont";
    if (typeof document === "undefined" || document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const formStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: 60,
    padding: "4px 4px 4px 20px",
    borderRadius: 9999,
    border: "1px solid #3d3d3d",
    background: "#000000",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    flex: "1 1 auto",
    minWidth: 0,
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    appearance: "none",
    fontSize: 20,
    fontWeight: 500,
    lineHeight: "28px",
    letterSpacing: "-0.5px",
    color: "#ffffff",
    fontFamily: '"Inter Display", "Inter", sans-serif',
    caretColor: "#ffffff",
  };

  const buttonStyle: React.CSSProperties = {
    height: 52,
    padding: "0 22px",
    borderRadius: 9999,
    border: "none",
    background: "#ffffff",
    color: "#000000",
    fontSize: 18,
    fontWeight: 500,
    lineHeight: "24px",
    letterSpacing: "-0.4px",
    cursor: isLoading ? "default" : "pointer",
    opacity: isLoading ? 0.6 : 1,
    fontFamily: '"Inter", sans-serif',
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const messageStyle: React.CSSProperties = {
    marginTop: 12,
    fontSize: 14,
    color: status === "success" || status === "duplicate" ? "#4ade80" : "#f87171",
    fontFamily: '"Inter", sans-serif',
    textAlign: "center",
  };

  return (
    <div style={{ width: "100%", fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        .waitlistbar-input::placeholder {
          color: #464646;
          font-size: 20px;
          line-height: 28px;
          letter-spacing: -0.5px;
          font-weight: 500;
          font-family: "Inter Display", "Inter", sans-serif;
        }
      `}</style>

      <form onSubmit={submit} style={formStyle}>
        <input
          ref={inputRef}
          autoFocus
          type="email"
          placeholder={inputPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={inputStyle}
          className="waitlistbar-input"
        />
        <button
          type="submit"
          disabled={isLoading}
          style={buttonStyle}
        >
          {isLoading ? loadingLabel : submitLabel}
        </button>
      </form>

      {showMessage && message ? <p style={messageStyle}>{message}</p> : null}
    </div>
  );
}
