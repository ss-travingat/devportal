// @ts-nocheck
// Framer code component: Get Featured (email → OTP → application → status).
// Self-contained — paste this whole file into a new Framer code component.
// Talks to https://app.travingat.com; images, fonts and flag icons load from
// CDNs, so nothing else needs installing in Framer.
import React, { useState, useRef } from "react"
import { countries } from "https://esm.sh/countries-list@3.4.1"

const countryOptions = Object.entries(countries)
    .map(([code, data]) => ({
        code,
        name: data.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

// ---- Shared with the app's /get-featured page (EmailVerificationForm) ----

// The Framer site lives on a different origin, so every call goes to the app.
const APP_URL = "https://app.travingat.com"
const CDN_ASSETS = "https://cdn.travingat.com/landingpage-assets"
// Illustrations used by the status screens (public/icons/* in the app repo,
// published to the CDN by `bun run upload:assets:r2`).
const SUBMITTED_ICON = CDN_ASSETS + "/icons/adventure-backpack.png"
const APPLIED_ICON = CDN_ASSETS + "/icons/application-pending.png"

type StatusVariant = "submitted" | "applied" | "approved" | "reapply_limit"

// Backend `featured` block: { applied, approved }.
const statusVariantFor = (featured): StatusVariant | null =>
    featured?.approved ? "approved" : featured?.applied ? "applied" : null

const STATUS_COPY: Record<StatusVariant, { title: string; body: string }> = {
    submitted: {
        title: "You’re all set!",
        body: "Thanks for applying! We'll let you know by email if you're selected to be featured on Travingat.",
    },
    applied: {
        title: "You’ve already applied",
        body: "Your application is with our team. We’ll email you if you’re selected to be featured.",
    },
    approved: {
        title: "You've been selected!",
        body: "Your application was approved. Continue setting up your featured profile; your saved progress is kept.",
    },
    reapply_limit: {
        title: "Application limit reached",
        body: "You've reached the maximum number of reapplications. Reach out to us directly and we'll review your case personally.",
    },
}

function validateLinkInput(input: string): { valid: boolean; message: string } {
    const v = input.trim()
    if (v.length === 0) return { valid: true, message: "" }

    const withoutProtocol = v.replace(/^https?:\/\//i, "")
    const withoutWww = withoutProtocol.replace(/^www\./i, "")
    const slashIdx = withoutWww.indexOf("/")
    const domain = (
        slashIdx >= 0 ? withoutWww.slice(0, slashIdx) : withoutWww
    ).toLowerCase()
    const path = slashIdx >= 0 ? withoutWww.slice(slashIdx) : ""
    const is = (base: string) => domain === base || domain.endsWith("." + base)

    if (is("instagram.com")) {
        if (/^\/[a-zA-Z0-9._]{1,30}\/?$/.test(path)) return { valid: true, message: "" }
        return { valid: false, message: "Use the format: instagram.com/yourhandle" }
    }
    if (is("tiktok.com")) {
        if (/^\/@[a-zA-Z0-9._]{1,24}\/?$/.test(path)) return { valid: true, message: "" }
        return { valid: false, message: "Use the format: tiktok.com/@yourhandle" }
    }
    if (is("x.com") || is("twitter.com")) {
        if (/^\/[a-zA-Z0-9_]{1,15}\/?$/.test(path)) return { valid: true, message: "" }
        return { valid: false, message: "Use the format: x.com/yourhandle" }
    }
    if (is("flickr.com")) {
        if (/^\/(photos|people)\/[a-zA-Z0-9@_.\-]+\/?$/.test(path)) return { valid: true, message: "" }
        return { valid: false, message: "Use the format: flickr.com/photos/yourname" }
    }
    if (is("dribbble.com")) {
        if (/^\/[a-zA-Z0-9_\-]{1,50}\/?$/.test(path)) return { valid: true, message: "" }
        return { valid: false, message: "Use the format: dribbble.com/yourhandle" }
    }
    if (is("youtube.com")) {
        if (
            /^\/@[a-zA-Z0-9._\-]{1,100}\/?$/.test(path) ||
            /^\/(c|channel|user)\/[a-zA-Z0-9._\-]{1,100}\/?$/.test(path)
        )
            return { valid: true, message: "" }
        return { valid: false, message: "Use the format: youtube.com/@yourchannel" }
    }
    if (is("linkedin.com")) {
        if (/^\/in\/[a-zA-Z0-9\-]{1,100}\/?$/.test(path)) return { valid: true, message: "" }
        return { valid: false, message: "Use the format: linkedin.com/in/yourname" }
    }
    if (is("behance.net")) {
        if (/^\/[a-zA-Z0-9_\-]{1,50}\/?$/.test(path)) return { valid: true, message: "" }
        return { valid: false, message: "Use the format: behance.net/yourname" }
    }
    if (/^[a-zA-Z0-9]([a-zA-Z0-9.\-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,12}(\/[^\s]*)?$/.test(withoutProtocol)) {
        return { valid: true, message: "" }
    }
    return {
        valid: false,
        message: "Enter a full link, e.g. instagram.com/username or flickr.com/photos/username",
    }
}

const SOCIAL_PLATFORMS = [
    "instagram.com", "tiktok.com", "x.com", "twitter.com",
    "flickr.com", "dribbble.com", "youtube.com", "linkedin.com", "behance.net",
]

async function checkLinkExists(url: string): Promise<string> {
    const domain = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase()
    if (SOCIAL_PLATFORMS.some((p) => domain === p || domain.endsWith("." + p))) return "unknown"
    try {
        const res = await fetch(APP_URL + "/api/check-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        })
        const data = await res.json()
        if (data.exists === true) return "ok"
        if (data.exists === false) return "not_found"
        return "unknown"
    } catch {
        return "unknown"
    }
}

const postJson = (path: string, body: any) =>
    fetch(APP_URL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    })
        .then((r) => r.json())
        .catch(() => ({ error: "Network error" }))

const getCountryCode = (value: string | null) => {
    if (!value) return null
    if (value.length === 2 && countryOptions.some((c) => c.code === value.toUpperCase()))
        return value.toUpperCase()
    const match = countryOptions.find((c) => c.name.toLowerCase() === value.toLowerCase())
    return match ? match.code : null
}

const EmailVerificationForm = () => {
    const [email, setEmail] = useState("")
    const [step, setStep] = useState<"email" | "otp" | "application" | "status">("email")
    const [statusVariant, setStatusVariant] = useState<StatusVariant | null>(null)
    const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [otp, setOtp] = useState(["", "", "", ""])
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [countrySearchQuery, setCountrySearchQuery] = useState("")
    const [linkInput, setLinkInput] = useState("")
    const [links, setLinks] = useState<string[]>([])
    const [linkCheckResults, setLinkCheckResults] = useState<Record<string, string>>({})
    const [linkCheckStatus, setLinkCheckStatus] = useState("idle")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [visitedCount, setVisitedCount] = useState("")
    const [resendCooldown, setResendCooldown] = useState(0)
    const cooldownRef = useRef<any>(null)
    const linkCheckTimerRef = useRef<any>(null)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Basic email validation regex
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const filteredCountries = countryOptions.filter((c) =>
        c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
    )

    const linkValidation = validateLinkInput(linkInput)
    const isLinkInputValid = linkValidation.valid
    const showLinkError = linkInput.trim().length > 0 && !isLinkInputValid
    const canAddLink =
        linkInput.trim().length > 0 &&
        isLinkInputValid &&
        links.length < 3 &&
        !links.includes(linkInput.trim())

    const isAppValid =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        selectedCountry !== null &&
        visitedCount !== "" &&
        parseInt(visitedCount) <= 195 &&
        links.length > 0

    const startResendCooldown = (seconds = 60) => {
        const expiresAt = Date.now() + seconds * 1000
        setResendCooldown(seconds)
        if (cooldownRef.current) clearInterval(cooldownRef.current)
        cooldownRef.current = setInterval(() => {
            const remaining = Math.ceil((expiresAt - Date.now()) / 1000)
            if (remaining <= 0) {
                clearInterval(cooldownRef.current)
                setResendCooldown(0)
            } else {
                setResendCooldown(remaining)
            }
        }, 500)
    }

    // Debounced "does this link exist" check on the link being typed.
    React.useEffect(() => {
        setLinkCheckStatus("idle")
        if (linkCheckTimerRef.current) clearTimeout(linkCheckTimerRef.current)
        const v = linkInput.trim()
        if (!v || !isLinkInputValid) return
        linkCheckTimerRef.current = setTimeout(async () => {
            setLinkCheckStatus("checking")
            setLinkCheckStatus(await checkLinkExists(v))
        }, 1500)
        return () => clearTimeout(linkCheckTimerRef.current)
    }, [linkInput, isLinkInputValid])

    React.useEffect(() => () => clearInterval(cooldownRef.current), [])

    // Returning visitors who are still signed in on the app skip straight to
    // their status (or the prefilled form), like /get-featured does with the
    // server-side session. Silently ignored when the session cookie isn't
    // sent cross-site.
    React.useEffect(() => {
        let cancelled = false
        fetch(APP_URL + "/api/auth/me", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data?.user?.email) return
                setEmail(data.user.email)
                const variant = statusVariantFor(data.featured)
                if (variant) {
                    setStatusVariant(variant)
                    setStep("status")
                } else {
                    prefillFrom(data.user, data.explorerCard)
                    setStep("application")
                }
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [])

    // Approved applicants continue in the app.
    React.useEffect(() => {
        if (step === "status" && statusVariant === "approved") {
            window.location.href = APP_URL + "/get-featured/create"
        }
    }, [step, statusVariant])

    const prefillFrom = (u: any = {}, ec: any = {}) => {
        u = u || {}
        ec = ec || {}
        let fname = u.first_name
        let lname = u.last_name
        if (!fname && !lname && ec.name) {
            const parts = ec.name.split(" ")
            fname = parts[0]
            lname = parts.slice(1).join(" ")
        }
        if (fname) setFirstName(fname)
        if (lname) setLastName(lname)

        const bestCountry = u.country || ec.country
        if (bestCountry) setSelectedCountry(getCountryCode(bestCountry) || bestCountry)

        let count = u.visited_count
        const ecVisited = ec.visitedCountries || ec.visited_countries
        if (!count && ecVisited) {
            if (Array.isArray(ecVisited)) count = ecVisited.length
            else if (typeof ecVisited === "string") {
                try {
                    count = JSON.parse(ecVisited).length
                } catch {
                    count = 0
                }
            }
        }
        if (count) setVisitedCount(count.toString())
        if (Array.isArray(u.links)) setLinks(u.links)
    }

    const handleSendCode = async () => {
        if (!isValidEmail) return
        setIsLoading(true)
        setError(null)
        setEmailStatusMessage(null)

        // Applied-but-not-approved applicants are told right under the email
        // field, without sending an OTP just to tell them to wait.
        const statusRes = await postJson("/api/auth/check-featured-status", { email })
        if (statusRes?.featured && statusVariantFor(statusRes.featured) === "applied") {
            setIsLoading(false)
            setEmailStatusMessage("You've already applied — we'll email you when you're selected.")
            return
        }

        const res = await postJson("/api/auth/request-otp", { email })
        setIsLoading(false)

        if (res.error) {
            alert(res.error)
            return
        }

        startResendCooldown(60)
        setStep("otp")
    }

    const handleResendCode = async () => {
        if (!isValidEmail || resendCooldown > 0) return
        setIsLoading(true)
        setError(null)
        const res = await postJson("/api/auth/request-otp", { email })
        setIsLoading(false)

        if (res.error) {
            startResendCooldown(res.retry_after || 60)
            setError(res.error)
            return
        }
        startResendCooldown(60)
    }

    const handleVerifyOtp = async () => {
        setIsLoading(true)
        setError(null)
        const res = await postJson("/api/auth/verify-otp", {
            email,
            otp: otp.join(""),
            source: "Get Featured",
        })
        setIsLoading(false)

        if (res.error) {
            setError(res.error)
            return
        }

        const variant = statusVariantFor(res.featured)
        if (variant) {
            // Already applied / approved: don't ask them to apply again.
            setStatusVariant(variant)
            setStep("status")
            return
        }
        if (res.user || res.explorerCard) prefillFrom(res.user, res.explorerCard)
        setStep("application")
    }

    const handleLogout = async () => {
        await postJson("/api/auth/logout-user", {})
        setStatusVariant(null)
        setStep("email")
        setEmail("")
        setOtp(["", "", "", ""])
        setError(null)
        setFirstName("")
        setLastName("")
        setVisitedCount("")
        setLinks([])
        setLinkCheckResults({})
        setSelectedCountry(null)
    }

    const addLink = () => {
        if (!canAddLink) return
        const url = linkInput.trim()
        setLinks([...links, url])
        setLinkCheckResults((prev) => ({ ...prev, [url]: linkCheckStatus }))
        setLinkInput("")
        setLinkCheckStatus("idle")
    }

    const handleSubmitApplication = async () => {
        setIsLoading(true)

        const validLinks = links
            .filter((l) => l && l.trim().length > 0)
            .map((l) =>
                l.startsWith("http://") || l.startsWith("https://")
                    ? l.trim()
                    : `https://${l.trim()}`
            )

        const res = await postJson("/api/auth/submit-application", {
            firstName,
            lastName,
            country: selectedCountry || "Unknown",
            visitedCount: Number(visitedCount),
            links: validLinks,
            link_statuses: linkCheckResults,
        })
        setIsLoading(false)

        if (!res.success) {
            if (res.reapplyLimitReached) {
                setStatusVariant("reapply_limit")
                setStep("status")
                return
            }
            const errorMsg =
                res.error ||
                res.detail ||
                (typeof res === "object"
                    ? Object.values(res).flat().join("\n")
                    : "Submission failed")
            alert("Error: " + errorMsg)
            return
        }

        // Stay signed in on a confirmation screen instead of resetting to an
        // empty form, which made a reload look like they still had to apply.
        setStatusVariant(
            res.alreadyApplied
                ? statusVariantFor(res.featured) ?? "applied"
                : "submitted"
        )
        setStep("status")
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 4)
        if (pastedData) {
            const newOtp = [...otp]
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i]
            }
            setOtp(newOtp)
            const focusIndex = Math.min(pastedData.length, 3)
            inputRefs.current[focusIndex]?.focus()
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        setError(null)
        const digits = value.replace(/\D/g, "")
        if (!digits && value) return // ignore non-digits

        const newOtp = [...otp]
        // Take the last character in case they type over an existing digit without selecting it
        const lastChar = digits.slice(-1)
        newOtp[index] = lastChar
        setOtp(newOtp)

        // Auto-focus next input
        if (lastChar && index < 3) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        // Move to previous input on backspace if current is empty
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        // Submit OTP on enter
        if (e.key === "Enter") {
            handleVerifyOtp()
        }
    }

    if (step === "status" && statusVariant === "approved") return null

    if (step === "status" && statusVariant) {
        const { title, body } = STATUS_COPY[statusVariant]
        const illustrated = statusVariant === "submitted" || statusVariant === "applied"
        const isApplied = statusVariant === "applied"
        return (
            <div className={"tf-status"}>
                <div className={"tf-status-content"}>
                {illustrated && (
                    <div className={"tf-status-iconBox"}>
                        {isApplied ? (
                            <div className={"tf-status-imgWrap tf-status-pendingWrap"}>
                                <img src={APPLIED_ICON} alt="" className={"tf-status-pendingImg"} />
                            </div>
                        ) : (
                            <div className={"tf-status-imgWrap tf-status-backpackWrap"}>
                                <img src={SUBMITTED_ICON} alt="" className={"tf-status-backpackImg"} />
                            </div>
                        )}
                    </div>
                )}
                {!illustrated && (
                    <div className={"tf-status-checkBadge"}>
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#5a45f9" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                )}
                <div className={"tf-status-text"}>
                    <div className={"tf-status-title"}>{title}</div>
                    <div className={"tf-status-body"}>{body}</div>
                    {isApplied && email && (
                        <div className={"tf-status-email"}>{email}</div>
                    )}
                </div>
                {statusVariant === "reapply_limit" && (
                    <a
                        className={"tf-status-btn tf-status-btnPrimary"}
                        href="mailto:hello@travingat.com?subject=Featured%20Application%20Review%20Request"
                    >
                        Contact us
                    </a>
                )}
                <a
                    className={`${"tf-status-btn"} ${illustrated ? "tf-status-btnWhite" : ""}`}
                    href={isApplied ? APP_URL + "/featured-profiles" : statusVariant === "submitted" ? "https://travingat.com" : APP_URL}
                >
                    {isApplied ? "Explore profiles" : statusVariant === "submitted" ? "Done!" : "Back to profiles"}
                </a>
                {!illustrated && (
                    <div className={"tf-resendCode"} onClick={handleLogout}>
                        Not you? Use a different email
                    </div>
                )}
                </div>
            </div>
        )
    }

    if (step === "otp") {
        return (
            <div className={"tf-form"}>
                <div className={"tf-otpFieldParent"}>
                    <div className={"tf-otpInner"}>
                        <div className={"tf-emailField"}>
                            <img
                                src="https://cdn.travingat.com/email-assets/eIconl.png"
                                alt="Email"
                                className={"tf-icon"}
                            />
                            <div className={"tf-otpHeader"}>
                                <div className={"tf-emailLabel"}>
                                    Verify your email
                                </div>
                                <div className={"tf-submittedEmail"}>
                                    {email}
                                </div>
                            </div>
                            <div className={"tf-otpInputsContainer"}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] = el
                                        }}
                                        type="text"
                                        maxLength={2} // Using 2 so overtyping produces a new character
                                        value={digit}
                                        onChange={(e) =>
                                            handleOtpChange(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyDown(index, e)
                                        }
                                        onPaste={handlePaste}
                                        className={"tf-otpInput"}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className={"tf-buttonText"}>
                            <button
                                onClick={handleVerifyOtp}
                                disabled={isLoading}
                                className={`${"tf-button"} ${!isLoading ? "tf-buttonActive" : ""}`}
                            >
                                {isLoading ? "Verifying..." : "Verify email"}
                            </button>
                            {error && <div className={"tf-errorText"}>{error}</div>}
                            <div
                                className={"tf-resendCode"}
                                onClick={handleResendCode}
                                style={
                                    isLoading || resendCooldown > 0
                                        ? { opacity: 0.5, cursor: "not-allowed" }
                                        : {}
                                }
                            >
                                {resendCooldown > 0
                                    ? `Resend code in ${resendCooldown}s`
                                    : "Resend code"}
                            </div>
                            <div
                                className={"tf-resendCode"}
                                onClick={() => {
                                    setStep("email")
                                    setOtp(["", "", "", ""])
                                    setError(null)
                                }}
                            >
                                Not you? Use a different email
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    if (step === "application") {
        return (
            <div className={"tf-app-form"}>
                <div className={"tf-app-emailField"}>
                    <div className={"tf-app-emailLabel"}>Full name</div>
                    <div className={"tf-app-emailInputParent"}>
                        <div className={"tf-app-emailInput"}>
                            <input
                                type="text"
                                placeholder="First name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "white",
                                    width: "100%",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                }}
                            />
                        </div>
                        <div className={"tf-app-emailInput"}>
                            <input
                                type="text"
                                placeholder="Last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "white",
                                    width: "100%",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className={"tf-app-emailField"}>
                    <div className={"tf-app-emailLabel"}>Email</div>
                    <div className={"tf-app-fullNameInput"}>
                        <input
                            type="email"
                            value={email}
                            disabled
                            style={{
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                color: "#525252",
                                width: "100%",
                                fontFamily: "Inter",
                                fontSize: "16px",
                            }}
                        />
                    </div>
                </div>

                <div className={"tf-app-emailField"}>
                    <div className={"tf-app-emailLabel"}>
                        Where are you from?
                    </div>
                    <div className={"tf-selectWrapper"}>
                        {!isDropdownOpen ? (
                            <div
                                className={"tf-app-countryInput"}
                                onClick={() => setIsDropdownOpen(true)}
                                style={{ cursor: "pointer" }}
                            >
                                {selectedCountry ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flex: 1,
                                            color: "white",
                                        }}
                                    >
                                        <span
                                            className={`fi fi-${selectedCountry.toLowerCase()}`}
                                        />
                                        {
                                            countryOptions.find(
                                                (c) =>
                                                    c.code === selectedCountry
                                            )?.name
                                        }
                                    </div>
                                ) : (
                                    <div style={{ flex: 1 }}>
                                        Select country
                                    </div>
                                )}
                                <img
                                    src={`https://cdn.travingat.com/landingpage-assets/get-featured/dropdown-icon.svg`}
                                    alt="Toggle Dropdown"
                                    className={`${"tf-app-dropdownIcon"} ${isDropdownOpen ? "tf-selectIconOpen" : ""}`}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    paddingLeft: 16,
                                    paddingRight: 16,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    position: "relative",
                                    background: "black",
                                    borderRadius: 10,
                                    outline: "1px #1E1E1E solid",
                                    outlineOffset: "-1px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        width: 24,
                                        height: 24,
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z"
                                            fill="#7C7C7C"
                                        />
                                    </svg>
                                </div>
                                <div
                                    style={{
                                        width: 1,
                                        height: 24,
                                        background: "white",
                                        opacity: 0.2,
                                    }}
                                ></div>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search country"
                                    value={countrySearchQuery}
                                    onChange={(e) =>
                                        setCountrySearchQuery(e.target.value)
                                    }
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        outline: "none",
                                        color: "white",
                                        fontSize: 16,
                                        fontFamily: "Inter",
                                        fontWeight: "400",
                                        lineHeight: "24px",
                                        width: "100%",
                                    }}
                                />
                            </div>
                        )}

                        {isDropdownOpen && (
                            <div className={"tf-dropdownMenu"}>
                                {filteredCountries.map((country) => (
                                    <div
                                        key={country.code}
                                        className={`${"tf-dropdownItem"} ${selectedCountry === country.code ? "tf-dropdownItemSelected" : ""}`}
                                        onClick={() => {
                                            setSelectedCountry(country.code)
                                            setIsDropdownOpen(false)
                                            setCountrySearchQuery("")
                                        }}
                                    >
                                        <span
                                            className={`fi fi-${country.code.toLowerCase()}`}
                                        />
                                        {country.name}
                                    </div>
                                ))}
                                {filteredCountries.length === 0 && (
                                    <div
                                        style={{
                                            padding: "10px 16px",
                                            color: "#7C7C7C",
                                        }}
                                    >
                                        No countries found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={"tf-app-emailField"}>
                    <div className={"tf-app-emailLabel"}>
                        How many countries have you visited?
                    </div>
                    <div className={"tf-app-emailInputContainer"}>
                        <div
                            className={"tf-app-fullNameInput"}
                            style={
                                visitedCount !== "" &&
                                parseInt(visitedCount) > 195
                                    ? { borderColor: "#EF4444" }
                                    : {}
                            }
                        >
                            <input
                                type="number"
                                placeholder="e.g. 10"
                                min={0}
                                max={195}
                                value={visitedCount}
                                onChange={(e) =>
                                    setVisitedCount(e.target.value)
                                }
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "white",
                                    width: "100%",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                }}
                            />
                        </div>
                        {visitedCount !== "" &&
                            parseInt(visitedCount) > 195 && (
                                <div
                                    style={{
                                        width: "100%",
                                        color: "#EF4444",
                                        fontSize: "14px",
                                        fontFamily: "Inter",
                                        fontWeight: "400",
                                        lineHeight: "20px",
                                        wordWrap: "break-word",
                                        marginTop: "4px",
                                    }}
                                >
                                    Maximum number of countries is 195
                                </div>
                            )}
                    </div>
                </div>

                <div className={"tf-app-emailField"}>
                    <div className={"tf-app-emailLabel"}>
                        Share links to your travel photos
                    </div>
                    <div className={"tf-app-emailInputContainer"}>
                        <div
                            className={"tf-app-emailInput4"}
                            style={
                                showLinkError ? { borderColor: "#EF4444" } : {}
                            }
                        >
                            <div className={"tf-app-socialMediainstagram"} />
                            <div className={"tf-app-emailPlaceholder4"}>
                                <input
                                    type="text"
                                    maxLength={100}
                                    placeholder={
                                        links.length >= 3
                                            ? "Maximum 3 links reached"
                                            : "e.g. instagram.com/username"
                                    }
                                    value={linkInput}
                                    onChange={(e) =>
                                        setLinkInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            addLink()
                                        }
                                    }}
                                    disabled={links.length >= 3}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        outline: "none",
                                        color: "white",
                                        width: "100%",
                                        fontFamily: "Inter",
                                        fontSize: "16px",
                                    }}
                                />
                            </div>
                            {linkCheckStatus === "checking" && (
                                <div
                                    className={"tf-linkCheckSpinner"}
                                    title="Checking link…"
                                />
                            )}
                            {linkCheckStatus === "ok" && (
                                <svg
                                    className={"tf-linkCheckOk"}
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    aria-label="Link looks good"
                                >
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            <div
                                className={"tf-app-emailPlaceholderWrapper"}
                                onClick={addLink}
                                style={{
                                    cursor: canAddLink ? "pointer" : "not-allowed",
                                    opacity: canAddLink ? 1 : 0.5,
                                    backgroundColor: canAddLink ? "white" : "#1a1a1a",
                                    color: canAddLink ? "#161616" : "#3d3d3d",
                                }}
                            >
                                <div
                                    className={"tf-app-emailPlaceholder5"}
                                >{`Add`}</div>
                            </div>
                        </div>
                        <div
                            style={{
                                width: "100%",
                                color: showLinkError ? "#EF4444" : "#989898",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: "20px",
                                wordWrap: "break-word",
                                marginTop: "4px",
                            }}
                        >
                            {showLinkError
                                ? linkValidation.message
                                : "Enter a full link, e.g. instagram.com/username"}
                        </div>
                        {links.map((link, index) => (
                            <div
                                key={index}
                                className={"tf-addedLinkBadge"}
                                style={{ marginTop: "10px" }}
                            >
                                <div className={"tf-addedLinkText"}>{link}</div>
                                {linkCheckResults[link] === "ok" && (
                                    <svg
                                        style={{ width: 14, height: 14, color: "#4ade80", flexShrink: 0 }}
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                <div
                                    className={"tf-addedLinkRemoveBtn"}
                                    onClick={() => {
                                        setLinks(links.filter((_, i) => i !== index))
                                        setLinkCheckResults((prev) => {
                                            const n = { ...prev }
                                            delete n[link]
                                            return n
                                        })
                                    }}
                                >
                                    <img
                                        src={`https://cdn.travingat.com/landingpage-assets/get-featured/close.svg`}
                                        alt="Remove link"
                                        width={8}
                                        height={8}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    className={`${"tf-app-button"} ${isAppValid && !isLoading ? "tf-submitAppBtnActive" : ""}`}
                    disabled={!isAppValid || isLoading}
                    onClick={handleSubmitApplication}
                >
                    <div className={"tf-app-button2"}>
                        {isLoading ? "Submitting..." : "Submit"}
                    </div>
                </button>

                <div className={"tf-app-fullNameLabel2"}>
                    Applications are reviewed manually. If selected, we&apos;ll
                    email you a private upload link to create your travel
                    profile before launch.
                </div>
            </div>
        )
    }
    return (
        <div className={"tf-form"}>
            <div className={"tf-emailFieldParent"}>
                <div className={"tf-emailField"}>
                    <img
                        src="https://cdn.travingat.com/email-assets/eIconl.png"
                        alt="Email"
                        className={"tf-icon"}
                    />
                    <div className={"tf-emailLabel"}>
                        Verify your email to apply
                    </div>
                    <div className={"tf-emailInputContainer"}>
                        <input
                            type="email"
                            placeholder="e.g. james@email.com"
                            className={"tf-emailInput"}
                            value={email}
                            onChange={(e) => {
                                setEmailStatusMessage(null)
                                setEmail(e.target.value)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && isValidEmail) {
                                    e.preventDefault()
                                    handleSendCode()
                                }
                            }}
                        />
                    </div>
                </div>
                <div className={"tf-buttonText"}>
                    <button
                        className={`${"tf-button"} ${isValidEmail && !isLoading ? "tf-buttonActive" : ""}`}
                        disabled={!isValidEmail || isLoading}
                        onClick={handleSendCode}
                    >
                        {isLoading ? "Sending..." : "Send code"}
                    </button>
                    {emailStatusMessage && (
                        <div className={"tf-errorText"}>
                            {emailStatusMessage}
                        </div>
                    )}
                    <div className={"tf-emailLabel2"}>
                        We&apos;ll verify your email before continuing your
                        application.
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 420
 */
export default function FramerFrontend(props) {
    return (
        <div style={{ width: "100%", ...props.style }}>
            <style
                dangerouslySetInnerHTML={{
                    __html: `
@import url("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500&display=swap");
@import url("https://cdn.jsdelivr.net/npm/flag-icons@7.6.0/css/flag-icons.min.css");

.tf-form {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  text-align: center;
  font-size: 24px;
  color: #fff;
  font-family: 'Inter Display', var(--font-sans, Inter, system-ui, sans-serif);
  width: 100%;
  gap: 24px;
}

.tf-emailFieldParent {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  gap: 24px;
  max-width: 100%;
}

.tf-emailField {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.tf-icon {
  width: 100px;
  height: 100px;
  position: relative;
  border-radius: 16.81px;
  object-fit: cover;
}

.tf-emailLabel {
  align-self: stretch;
  position: relative;
  letter-spacing: -0.5px;
  line-height: 32px;
  font-weight: 500;
  font-size: 24px;
  text-align: center;
}

.tf-emailInputContainer {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: #2a2a2a;
}

.tf-emailInput {
  align-self: stretch;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  text-align: center;
  background-color: transparent;
  color: #fff;
  outline: none;
  border: none;
  letter-spacing: -0.5px;
  line-height: 32px;
  font-size: 24px;
  font-family: 'Inter Display', var(--font-sans, Inter, system-ui, sans-serif);
  box-sizing: border-box;
  width: 100%;
}

.tf-emailInput::placeholder {
  color: #2a2a2a;
}

.tf-buttonText {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: left;
  font-size: 14px;
  color: #ecf0ff;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  padding: 0 32px;
}

.tf-button {
  width: 100%;
  position: relative;
  align-self: stretch;
  border-radius: 999px;
  background-color: #c0caff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  box-sizing: border-box;
  text-align: left;
  font-size: 16px;
  color: #ecf0ff;
  font-family: Inter, sans-serif;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 24px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tf-buttonActive {
  background-color: #5A45F9;
  color: #FFF;
}

.tf-emailLabel2 {
  align-self: stretch;
  position: relative;
  letter-spacing: -0.01em;
  line-height: 20px;
  color: #7c7c7c;
  text-align: center;
}

.tf-otpFieldParent {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  gap: 32px;
  max-width: 100%;
}

.tf-otpInner {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.tf-otpHeader {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.tf-submittedEmail {
  align-self: stretch;
  text-align: center;
  color: #7C7C7C;
  font-size: 14px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
}

.tf-otpInputsContainer {
  height: 60px;
  display: inline-flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 10px;
}

.tf-otpInput {
  width: 62px;
  align-self: stretch;
  padding: 12px 16px;
  background-color: #000;
  border-radius: 10px;
  border: 1px solid #252525;
  color: #fff;
  text-align: center;
  font-size: 24px;
  font-family: var(--font-sans, Inter, system-ui, sans-serif);
  box-sizing: border-box;
}

.tf-otpInput:focus {
  outline: none;
  border-color: #fff;
}

.tf-resendCode {
  text-align: center;
  color: #7C7C7C;
  font-size: 14px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 20px;
  cursor: pointer;
}

.tf-resendCode:hover {
  text-decoration: underline;
}

.tf-appFormParent {
  width: 100%;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 20px;
  box-sizing: border-box;
}

.tf-fieldContainer {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 10px;
}

.tf-fieldLabel {
  align-self: stretch;
  color: white;
  font-size: 14px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
  text-align: left;
}

.tf-inputRow {
  align-self: stretch;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
}

.tf-textInput {
  flex: 1 1 0;
  padding: 12px 16px;
  background-color: black;
  border-radius: 10px;
  border: 1px solid #1E1E1E;
  color: white;
  font-size: 16px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 24px;
  outline: none;
  box-sizing: border-box;
  width: 100%;
}

.tf-textInput[type=number]::-webkit-outer-spin-button,
.tf-textInput[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.tf-textInput[type=number] {
  -moz-appearance: textfield;
}

.tf-textInput::placeholder {
  color: #525252;
}

.tf-textInput:focus {
  border-color: #525252;
}

.tf-textInput:disabled {
  color: #525252;
}

.tf-inputWithButtonWrapper {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  padding: 12px 8px 12px 16px;
  background-color: black;
  border-radius: 10px;
  border: 1px solid #1E1E1E;
  box-sizing: border-box;
}

.tf-inputWithButtonWrapper:focus-within {
  border-color: #525252;
}

.tf-textInputNoBorder {
  flex: 1 1 0;
  background-color: transparent;
  border: none;
  color: white;
  font-size: 16px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 24px;
  outline: none;
  padding: 0;
}

.tf-textInputNoBorder::placeholder {
  color: #525252;
}

.tf-addLinkBtn {
  padding: 8px;
  background-color: #1A1A1A;
  border-radius: 6px;
  border: 1px solid #353535;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: #3D3D3D;
  font-size: 12px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tf-addLinkBtnActive {
  color: #161616;
  background-color: white;
}

.tf-selectWrapper {
  position: relative;
  flex: 1 1 0;
  display: flex;
}

.tf-selectInput {
  width: 100%;
  appearance: none;
  padding: 12px 40px 12px 16px;
  background-color: black;
  border-radius: 10px;
  border: 1px solid #1E1E1E;
  color: white;
  font-size: 16px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 24px;
  outline: none;
  box-sizing: border-box;
}

.tf-selectInput:invalid {
  color: #525252;
}

.tf-selectIcon {
  width: 24px;
  height: 24px;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  transition: transform 0.2s ease;
}

.tf-selectIconOpen {
  transform: translateY(-50%) rotate(180deg);
}

.tf-submitAppBtn {
  align-self: stretch;
  padding: 10px 18px;
  background-color: #C0CAFF;
  border-radius: 999px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ECF0FF;
  font-size: 16px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 500;
  line-height: 24px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tf-submitAppBtnActive {
  background-color: #5A45F9;
  color: white;
}

.tf-addedLinkBadge {
  width: 100%;
  padding: 6px 6px 6px 10px;
  background-color: #1E1E1E;
  border-radius: 8px;
  border: 1px solid #252525;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}

.tf-addedLinkText {
  flex: 1 1 0;
  color: white;
  font-size: 14px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
  text-align: left;
}

.tf-addedLinkRemoveBtn {
  padding: 6px;
  background-color: #404040;
  border-radius: 99px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tf-addedLinkRemoveBtn:hover {
  background-color: #525252;
}

.tf-appFooterText {
  align-self: stretch;
  text-align: center;
  color: white;
  font-size: 14px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  font-weight: 400;
  line-height: 20px;
}


.tf-dropdownMenu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: #1a1a1a;
  border-radius: 10px;
  border: 1px solid #1E1E1E;
  margin-top: 4px;
  z-index: 10;
  padding: 8px 0;
}

.tf-dropdownItem {
  padding: 10px 16px;
  color: white;
  font-size: 16px;
  font-family: var(--font-secondary, Inter, system-ui, sans-serif);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tf-dropdownItem:hover {
  background-color: #353535;
}

.tf-dropdownItemSelected {
  background-color: #5A45F9;
}

.tf-form *, .tf-appFormParent * {
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .tf-icon {
    display: none;
  }
  .tf-emailLabel {
    font-size: 20px;
    line-height: 28px;
  }
}


.tf-app-form {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  text-align: left;
  font-size: 14px;
  color: #fff;
  font-family: Inter, var(--font-sans, Inter, system-ui, sans-serif);
}
.tf-app-emailField {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.tf-app-emailLabel {
  align-self: stretch;
  position: relative;
  letter-spacing: -0.01em;
  line-height: 20px;
}
.tf-app-emailInputParent {
  align-self: stretch;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #525252;
}
.tf-app-emailInput {
  flex: 1;
  border-radius: 10px;
  background-color: #000;
  border: 1px solid #1e1e1e;
  display: flex;
  align-items: center;
  padding: 12px 16px;
}
.tf-app-countryInput {
  align-self: stretch;
  border-radius: 10px;
  background-color: #000;
  border: 1px solid #1e1e1e;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
  font-size: 16px;
  color: #525252;
}
.tf-app-dropdownIcon {
  height: 24px;
  width: 24px;
  position: relative;
  object-fit: cover;
}
.tf-app-fullNameInput {
  align-self: stretch;
  border-radius: 10px;
  background-color: #000;
  border: 1px solid #1e1e1e;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 16px;
  color: #525252;
}
.tf-app-emailInputContainer {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 16px;
  color: #525252;
}
.tf-app-emailInput4 {
  align-self: stretch;
  height: 48px;
  border-radius: 10px;
  background-color: #000;
  border: 1px solid #1e1e1e;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 12px 8px 12px 16px;
  gap: 8px;
}
.tf-app-socialMediainstagram {
  height: 24px;
  width: 24px;
  position: relative;
  display: none;
  flex-shrink: 0;
}
.tf-app-emailPlaceholder4 {
  flex: 1;
  position: relative;
  letter-spacing: -0.01em;
  line-height: 24px;
  flex-shrink: 0;
}
.tf-app-emailPlaceholderWrapper {
  border-radius: 6px;
  background-color: #1a1a1a;
  border: 1px solid #353535;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  flex-shrink: 0;
  font-size: 12px;
  color: #3d3d3d;
}
.tf-app-emailPlaceholder5 {
  position: relative;
  letter-spacing: -0.01em;
  line-height: 16px;
  font-weight: 500;
}
.tf-app-button {
  align-self: stretch;
  border-radius: 999px;
  background-color: #c0caff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  font-size: 16px;
  color: #ecf0ff;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tf-app-button.tf-submitAppBtnActive {
  background-color: #5A45F9;
  color: white;
}
.tf-app-button2 {
  position: relative;
  letter-spacing: -0.01em;
  line-height: 24px;
  font-weight: 500;
}
.tf-app-fullNameLabel2 {
  align-self: stretch;
  position: relative;
  letter-spacing: -0.01em;
  line-height: 20px;
  text-align: center;
  color: #989898;
}

.tf-errorText {
  align-self: stretch;
  text-align: center;
  color: #EF4444;
  font-size: 14px;
  font-family: Inter, var(--font-sans, Inter, system-ui, sans-serif);
  line-height: 20px;
}

.tf-linkCheckSpinner {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid #353535;
  border-top-color: #fff;
  animation: tf-spin 0.8s linear infinite;
}

.tf-linkCheckOk {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #4ade80;
}

@keyframes tf-spin {
  to { transform: rotate(360deg); }
}

/* Figma "Form": fixed 500x678 #111 panel, px 32 / pb 32, content centred
   (centred over the narrower Framer column, like the app's status step). */
.tf-status {
  position: relative;
  flex-shrink: 0;
  width: 500px;
  max-width: none;
  height: 678px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px 32px;
  background: #111;
  border-radius: 20px;
  overflow: hidden;
  box-sizing: border-box;
  text-align: center;
  color: #fff;
  font-family: Inter, var(--font-sans, Inter, system-ui, sans-serif);
}

/* Figma "Success": p-32, gap 24 (372px text column inside 500px). */
.tf-status-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

@media (max-width: 1023px) {
  .tf-status {
    width: 100%;
    height: auto;
    left: 0;
    transform: none;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }
}

.tf-status-iconBox {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  overflow: hidden;
}

.tf-status-imgWrap {
  position: absolute;
  left: calc(50% - 4px);
  top: calc(50% + 6px);
  transform: translate(-50%, -50%);
  overflow: hidden;
  pointer-events: none;
}

.tf-status-backpackWrap {
  width: 192px;
  height: 192px;
}

.tf-status-backpackImg {
  position: absolute;
  left: 0;
  top: -1.1%;
  width: 100%;
  height: 100%;
  max-width: none;
  user-select: none;
}

.tf-status-pendingWrap {
  width: 162px;
  height: 162px;
}

.tf-status-pendingImg {
  position: absolute;
  left: 3.56%;
  top: 1.2%;
  width: 100%;
  height: 100%;
  max-width: none;
  user-select: none;
}

.tf-status-checkBadge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tf-status-text {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tf-status-title {
  font-family: 'Inter Display', Inter, var(--font-sans, Inter, system-ui, sans-serif);
  font-weight: 500;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: -0.5px;
}

.tf-status-body {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.084px;
}

.tf-status-email {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.084px;
  color: #656565;
  word-break: break-all;
}

.tf-status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 32px;
  border-radius: 999px;
  background: #1a1a1a;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: -0.096px;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.tf-status-btnWhite {
  background: #fff;
  color: #000;
}

.tf-status-btnWhite:hover {
  background: #eaeaea;
}

.tf-status-btnPrimary {
  background: #5a45f9;
  color: #fff;
}
`,
                }}
            />
            <EmailVerificationForm />
        </div>
    )
}
