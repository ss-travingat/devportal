// @ts-nocheck
// Framer code component: Get Featured (email → OTP → application → status).
//
// This is a 1:1 port of the app's /get-featured page — same copy, icons,
// card, spacing, colours and behaviour. Each step below mirrors a file in
// src/features/getfeatured/ (EmailVerificationForm, GetFeaturedEmailStep,
// GetFeaturedOtpStep, GetFeaturedFormStep + form.module.css,
// GetFeaturedStatusStep). When one of those changes, port the change here.
//
// Self-contained — paste this whole file into a new Framer code component.
// Talks to https://app.travingat.com; images, fonts and flag icons load from
// CDNs, so nothing else needs installing in Framer.
import React, { useState, useRef, useEffect, useLayoutEffect, useId } from "react"
import { createPortal } from "react-dom"

// The Framer site lives on a different origin, so every call goes to the app.
const APP_URL = "https://app.travingat.com"
// "Explore profiles" goes to the marketing site, not the app's old /featured-profiles.
const PROFILES_URL = "https://travingat.com/profiles"
const CDN_ASSETS = "https://cdn.travingat.com/landingpage-assets"

// Same images the app page shows. They aren't on the CDN, so they come through
// the app's own image optimizer (exactly what next/image serves on /get-featured).
const appImage = (path: string, width = 384) =>
    `${APP_URL}/_next/image?url=${encodeURIComponent(path)}&w=${width}&q=75`
const statusIcon = (name: string) => appImage("/icons/get-featured/" + name + ".png")
const EMAIL_ICON = statusIcon("email")
const ERROR_ICON = appImage("/images/errors/something-went-wrong.png", 750)
// Where "Check system status" goes. Leave empty to hide the link (same as the
// app, which reads NEXT_PUBLIC_STATUS_PAGE_URL).
const STATUS_PAGE_URL = ""
const DROPDOWN_ICON = CDN_ASSETS + "/get-featured/dropdown-icon.svg"
const CLOSE_ICON = CDN_ASSETS + "/get-featured/close.svg"

// ---- Countries: same list and search as src/lib/countries.ts ----

// [code, name, aliases?]
const COUNTRY_LIST = [
    ["AF","Afghanistan"],
    ["AX","Aland Islands",["Åland Islands"]],
    ["AL","Albania"],
    ["DZ","Algeria"],
    ["AS","American Samoa"],
    ["AD","Andorra"],
    ["AO","Angola"],
    ["AI","Anguilla"],
    ["AQ","Antarctica"],
    ["AG","Antigua and Barbuda"],
    ["AR","Argentina"],
    ["AM","Armenia"],
    ["AW","Aruba"],
    ["SH-AC","Ascension Island"],
    ["ASEAN","Association of Southeast Asian Nations"],
    ["AU","Australia"],
    ["AT","Austria"],
    ["AZ","Azerbaijan"],
    ["BS","Bahamas"],
    ["BH","Bahrain"],
    ["BD","Bangladesh"],
    ["BB","Barbados"],
    ["BY","Belarus"],
    ["BE","Belgium"],
    ["BZ","Belize"],
    ["BJ","Benin"],
    ["BM","Bermuda"],
    ["BT","Bhutan"],
    ["BO","Bolivia"],
    ["BQ","Bonaire, Sint Eustatius and Saba",["Caribbean Netherlands","Bonaire"]],
    ["BA","Bosnia and Herzegovina"],
    ["BW","Botswana"],
    ["BV","Bouvet Island"],
    ["BR","Brazil"],
    ["IO","British Indian Ocean Territory"],
    ["BN","Brunei Darussalam",["Brunei"]],
    ["BG","Bulgaria"],
    ["BF","Burkina Faso"],
    ["BI","Burundi"],
    ["CV","Cabo Verde",["Cape Verde"]],
    ["KH","Cambodia"],
    ["CM","Cameroon"],
    ["CA","Canada"],
    ["KY","Cayman Islands"],
    ["CF","Central African Republic"],
    ["CEFTA","Central European Free Trade Agreement"],
    ["TD","Chad"],
    ["CL","Chile"],
    ["CN","China"],
    ["CX","Christmas Island"],
    ["CP","Clipperton Island"],
    ["CC","Cocos (Keeling) Islands"],
    ["CO","Colombia"],
    ["KM","Comoros"],
    ["CK","Cook Islands"],
    ["CR","Costa Rica"],
    ["HR","Croatia"],
    ["CU","Cuba"],
    ["CW","Curaçao",["Curacao"]],
    ["CY","Cyprus"],
    ["CZ","Czech Republic",["Czechia"]],
    ["CI","Côte d'Ivoire",["Ivory Coast"]],
    ["CD","Democratic Republic of the Congo",["DRC","DR Congo","Congo-Kinshasa"]],
    ["DK","Denmark"],
    ["DG","Diego Garcia"],
    ["DJ","Djibouti"],
    ["DM","Dominica"],
    ["DO","Dominican Republic"],
    ["EAC","East African Community"],
    ["EC","Ecuador"],
    ["EG","Egypt"],
    ["SV","El Salvador"],
    ["GB-ENG","England"],
    ["GQ","Equatorial Guinea"],
    ["ER","Eritrea"],
    ["EE","Estonia"],
    ["SZ","Eswatini",["Swaziland"]],
    ["ET","Ethiopia"],
    ["EU","Europe",["European Union"]],
    ["FK","Falkland Islands"],
    ["FO","Faroe Islands"],
    ["FM","Federated States of Micronesia",["Micronesia","FSM"]],
    ["FJ","Fiji"],
    ["FI","Finland"],
    ["FR","France"],
    ["GF","French Guiana"],
    ["PF","French Polynesia"],
    ["TF","French Southern Territories",["French Southern and Antarctic Lands"]],
    ["GA","Gabon"],
    ["GM","Gambia"],
    ["GE","Georgia"],
    ["DE","Germany"],
    ["GH","Ghana"],
    ["GI","Gibraltar"],
    ["GR","Greece"],
    ["GL","Greenland"],
    ["GD","Grenada"],
    ["GP","Guadeloupe"],
    ["GU","Guam"],
    ["GT","Guatemala"],
    ["GG","Guernsey"],
    ["GN","Guinea"],
    ["GW","Guinea-Bissau"],
    ["GY","Guyana"],
    ["HT","Haiti"],
    ["HM","Heard Island and McDonald Islands"],
    ["VA","Holy See",["Vatican City","Vatican"]],
    ["HN","Honduras"],
    ["HK","Hong Kong"],
    ["HU","Hungary"],
    ["IS","Iceland"],
    ["IN","India"],
    ["ID","Indonesia"],
    ["IR","Iran"],
    ["IQ","Iraq"],
    ["IE","Ireland"],
    ["IM","Isle of Man"],
    ["IL","Israel"],
    ["IT","Italy"],
    ["JM","Jamaica"],
    ["JP","Japan"],
    ["JE","Jersey"],
    ["JO","Jordan"],
    ["KZ","Kazakhstan"],
    ["KE","Kenya"],
    ["KI","Kiribati"],
    ["XK","Kosovo"],
    ["KW","Kuwait"],
    ["KG","Kyrgyzstan"],
    ["LA","Laos",["Lao PDR","Lao People's Democratic Republic"]],
    ["LV","Latvia"],
    ["ARAB","League of Arab States"],
    ["LB","Lebanon"],
    ["LS","Lesotho"],
    ["LR","Liberia"],
    ["LY","Libya"],
    ["LI","Liechtenstein"],
    ["LT","Lithuania"],
    ["LU","Luxembourg"],
    ["MO","Macau",["Macao"]],
    ["MG","Madagascar"],
    ["MW","Malawi"],
    ["MY","Malaysia"],
    ["MV","Maldives"],
    ["ML","Mali"],
    ["MT","Malta"],
    ["MH","Marshall Islands"],
    ["MQ","Martinique"],
    ["MR","Mauritania"],
    ["MU","Mauritius"],
    ["YT","Mayotte"],
    ["MX","Mexico"],
    ["MD","Moldova"],
    ["MC","Monaco"],
    ["MN","Mongolia"],
    ["ME","Montenegro"],
    ["MS","Montserrat"],
    ["MA","Morocco"],
    ["MZ","Mozambique"],
    ["MM","Myanmar",["Burma"]],
    ["NA","Namibia"],
    ["NR","Nauru"],
    ["NP","Nepal"],
    ["NL","Netherlands",["Holland"]],
    ["NC","New Caledonia"],
    ["NZ","New Zealand"],
    ["NI","Nicaragua"],
    ["NE","Niger"],
    ["NG","Nigeria"],
    ["NU","Niue"],
    ["NF","Norfolk Island"],
    ["KP","North Korea",["DPRK","Democratic People's Republic of Korea"]],
    ["MK","North Macedonia",["Macedonia"]],
    ["GB-NIR","Northern Ireland"],
    ["MP","Northern Mariana Islands"],
    ["NO","Norway"],
    ["OM","Oman"],
    ["PC","Pacific Community"],
    ["PK","Pakistan"],
    ["PW","Palau"],
    ["PA","Panama"],
    ["PG","Papua New Guinea",["PNG"]],
    ["PY","Paraguay"],
    ["PE","Peru"],
    ["PH","Philippines"],
    ["PN","Pitcairn",["Pitcairn Islands"]],
    ["PL","Poland"],
    ["PT","Portugal"],
    ["PR","Puerto Rico"],
    ["QA","Qatar"],
    ["CG","Republic of the Congo",["Congo-Brazzaville"]],
    ["RO","Romania"],
    ["RU","Russia",["Russian Federation"]],
    ["RW","Rwanda"],
    ["RE","Réunion",["Reunion"]],
    ["BL","Saint Barthélemy",["St Barts","St Barths","Saint Barthelemy","St. Barthelemy"]],
    ["SH-HL","Saint Helena"],
    ["SH","Saint Helena, Ascension and Tristan da Cunha"],
    ["KN","Saint Kitts and Nevis"],
    ["LC","Saint Lucia"],
    ["MF","Saint Martin"],
    ["PM","Saint Pierre and Miquelon"],
    ["VC","Saint Vincent and the Grenadines"],
    ["WS","Samoa"],
    ["SM","San Marino"],
    ["ST","Sao Tome and Principe",["São Tomé and Príncipe"]],
    ["SA","Saudi Arabia",["KSA"]],
    ["GB-SCT","Scotland"],
    ["SN","Senegal"],
    ["RS","Serbia"],
    ["SC","Seychelles"],
    ["SL","Sierra Leone"],
    ["SG","Singapore"],
    ["SX","Sint Maarten"],
    ["SK","Slovakia"],
    ["SI","Slovenia"],
    ["SB","Solomon Islands"],
    ["SO","Somalia"],
    ["ZA","South Africa"],
    ["GS","South Georgia and the South Sandwich Islands",["South Georgia"]],
    ["KR","South Korea",["Republic of Korea","Korea"]],
    ["SS","South Sudan"],
    ["ES","Spain",["Catalonia","Basque Country","Galicia","Canary Islands"]],
    ["LK","Sri Lanka"],
    ["PS","State of Palestine",["Palestine"]],
    ["SD","Sudan"],
    ["SR","Suriname"],
    ["SJ","Svalbard and Jan Mayen"],
    ["SE","Sweden"],
    ["CH","Switzerland"],
    ["SY","Syria"],
    ["TW","Taiwan"],
    ["TJ","Tajikistan"],
    ["TZ","Tanzania"],
    ["TH","Thailand"],
    ["TL","Timor-Leste",["East Timor","Timor Leste"]],
    ["TG","Togo"],
    ["TK","Tokelau"],
    ["TO","Tonga"],
    ["TT","Trinidad and Tobago"],
    ["SH-TA","Tristan da Cunha"],
    ["TN","Tunisia"],
    ["TM","Turkmenistan"],
    ["TC","Turks and Caicos Islands"],
    ["TV","Tuvalu"],
    ["TR","Türkiye",["Turkey"]],
    ["UG","Uganda"],
    ["UA","Ukraine"],
    ["AE","United Arab Emirates",["UAE"]],
    ["GB","United Kingdom",["UK","Great Britain"]],
    ["UN","United Nations"],
    ["UM","United States Minor Outlying Islands"],
    ["US","United States of America",["USA","US","United States"]],
    ["UY","Uruguay"],
    ["UZ","Uzbekistan"],
    ["VU","Vanuatu"],
    ["VE","Venezuela"],
    ["VN","Vietnam",["Viet Nam"]],
    ["VG","Virgin Islands (British)",["British Virgin Islands","BVI"]],
    ["VI","Virgin Islands (U.S.)",["US Virgin Islands","USVI"]],
    ["GB-WLS","Wales"],
    ["WF","Wallis and Futuna"],
    ["EH","Western Sahara"],
    ["YE","Yemen"],
    ["ZM","Zambia"],
    ["ZW","Zimbabwe"],
].map(([code, name, aliases]) => ({ code, name, aliases }))

// Organisations, a continent, Antarctica and uninhabited territories are not places someone
// is from. Same set as NON_COUNTRY_CODES in src/lib/countries.ts (this export
// can't import it) -- keep the two in step.
const NON_COUNTRY_CODES = new Set(["AQ", "ASEAN", "BV", "CEFTA", "CP", "DG", "EAC", "TF", "HM", "ARAB", "PC", "UN", "UM", "EU", "GS", "IO"])

const countryOptions = COUNTRY_LIST.filter((c) => !NON_COUNTRY_CODES.has(String(c.code).toUpperCase())).sort((a, b) => a.name.localeCompare(b.name))

function normalizeCountryName(text: string): string {
    if (!text) return ""
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\b(st|st\.)\b/g, "saint")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function matchCountryExact(country, query: string): boolean {
    if (!query) return false
    const q = normalizeCountryName(query)
    if (!q) return false
    const cName = normalizeCountryName(country.name)
    const cCode = normalizeCountryName(country.code)
    if (cName === q || cCode === q) return true
    if (country.aliases?.some((a) => normalizeCountryName(a) === q)) return true
    if (query.includes("(") && query.includes(")")) {
        const withoutParens = normalizeCountryName(query.replace(/\([^)]*\)/g, ""))
        if (withoutParens && (cName === withoutParens || country.aliases?.some((a) => normalizeCountryName(a) === withoutParens)))
            return true
        const insideParens = normalizeCountryName(query.match(/\(([^)]+)\)/)?.[1] || "")
        if (insideParens && (cName === insideParens || country.aliases?.some((a) => normalizeCountryName(a) === insideParens)))
            return true
    }
    if (country.name.includes("(") && country.name.includes(")")) {
        if (normalizeCountryName(country.name.replace(/\([^)]*\)/g, "")) === q) return true
    }
    return false
}

function searchCountry(country, query: string): boolean {
    if (!query) return true
    if (matchCountryExact(country, query)) return true
    const q = normalizeCountryName(query)
    if (!q) return true
    const cName = normalizeCountryName(country.name)
    const cCode = normalizeCountryName(country.code)
    if (cName.includes(q)) return true
    if (cCode === q) return true
    if (country.aliases?.some((a) => normalizeCountryName(a).includes(q))) return true
    if (query.includes("(") && query.includes(")")) {
        const withoutParens = normalizeCountryName(query.replace(/\([^)]*\)/g, ""))
        if (withoutParens && (cName.includes(withoutParens) || country.aliases?.some((a) => normalizeCountryName(a).includes(withoutParens))))
            return true
    }
    return false
}

const getInitialCountryCode = (countryValue: string | null) => {
    if (!countryValue) return null
    if (countryValue.length === 2 && countryOptions.some((c) => c.code === countryValue)) return countryValue
    const match = countryOptions.find((c) => c.name.toLowerCase() === countryValue.toLowerCase())
    return match ? match.code : null
}

// ---- Status ----

type StatusVariant = "submitted" | "applied" | "continue" | "in_review" | "live" | "reapply_limit"

// Backend `featured` block: { applied, approved }. "continue" is only the
// default for approved users: their builder status may turn it into
// "in_review" or "live" (see approvedStatusFrom).
const statusVariantFor = (featured): "continue" | "applied" | null =>
    featured?.approved ? "continue" : featured?.applied ? "applied" : null

const STATUS_COPY: Record<StatusVariant, { title: string; body: string }> = {
    submitted: {
        title: "You’re all set!",
        body: "Thanks for applying! We'll let you know by email if you're selected to be featured on Travingat.",
    },
    applied: {
        title: "You’ve already applied",
        body: "Your application is with our team. We’ll email you if you’re selected to be featured.",
    },
    continue: {
        title: "Continue your profile",
        body: "Your progress is saved. Pick up where you left off.",
    },
    in_review: {
        title: "Your profile has been submitted!",
        body: "We'll review your profile and email you a link once it's published. If any changes are needed, we'll let you know by email.",
    },
    live: {
        title: "Your profile is live",
        body: "Your featured profile has been approved and published. Contact us at hello@travingat.com if something needs to change.",
    },
    reapply_limit: {
        title: "Application limit reached",
        body: "You've reached the maximum number of reapplications. Reach out to us directly and we'll review your case personally.",
    },
}

// Mirrors src/features/getfeatured/session-status.ts. `data` is the body of
// GET /api/get-featured/prefill, or null if it couldn't be read. "start":
// approved but nothing saved in the builder yet, so they go straight into it.
const approvedStatusFrom = (data: any): { variant: StatusVariant | "start"; handle?: string } => {
    const reviewStatus = data?.prefill?.review_status
    const handle = String(data?.prefill?.handle || "").replace(/^@/, "") || undefined
    if (reviewStatus === "ready_for_review") return { variant: "in_review" }
    // Same rule as the builder's "profile is live" wall.
    if (reviewStatus === "published" && data?.can_edit !== true) return { variant: "live", handle }
    // Approving an application doesn't create a profile; the builder's first
    // save does. No profile means nothing to continue: open the builder.
    if (data?.has_existing_profile === false) return { variant: "start" }
    // Saved progress (or the data couldn't be read): the "Continue your
    // profile" card, whose button opens the builder.
    return { variant: "continue" }
}

const BUILDER_URL = APP_URL + "/get-featured/create"

const fetchApprovedStatus = () =>
    fetch(APP_URL + "/api/get-featured/prefill", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then(approvedStatusFrom)

// States with an illustration, a white action and (mostly) a way to switch email.
const illustratedState = (variant: StatusVariant, handle?: string) => {
    switch (variant) {
        case "submitted":
            return { icon: statusIcon("all-set"), action: "Done!", href: APP_URL + "/", switchEmail: null }
        case "applied":
            return { icon: statusIcon("already-applied"), action: "Explore profiles", href: PROFILES_URL, switchEmail: "Apply with a different email" }
        case "continue":
            return { icon: statusIcon("saved-progress"), action: "Continue editing", href: BUILDER_URL, switchEmail: "Use a different email" }
        case "in_review":
            return { icon: statusIcon("all-set"), action: "Explore profiles", href: PROFILES_URL, switchEmail: "Use a different email" }
        case "live":
            return {
                icon: statusIcon("all-set"),
                action: handle ? "View your profile" : "Explore profiles",
                href: handle ? APP_URL + "/" + handle : PROFILES_URL,
                switchEmail: "Use a different email",
            }
        default:
            return null
    }
}

// ---- Links ----

function validateLinkInput(input: string): { valid: boolean; message: string } {
    const v = input.trim()
    if (v.length === 0) return { valid: true, message: "" }

    const withoutProtocol = v.replace(/^https?:\/\//i, "")
    const withoutWww = withoutProtocol.replace(/^www\./i, "")
    const slashIdx = withoutWww.indexOf("/")
    const domain = (slashIdx >= 0 ? withoutWww.slice(0, slashIdx) : withoutWww).toLowerCase()
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

const PLATFORM_SUGGESTIONS = [
    { label: "Instagram", prefix: "instagram.com/", hint: "yourhandle", keywords: ["instagram", "insta"] },
    { label: "TikTok", prefix: "tiktok.com/@", hint: "yourhandle", keywords: ["tiktok"] },
    { label: "X", prefix: "x.com/", hint: "yourhandle", keywords: ["x.com", "twitter"] },
    { label: "Flickr", prefix: "flickr.com/photos/", hint: "yourname", keywords: ["flickr"] },
    { label: "Dribbble", prefix: "dribbble.com/", hint: "yourhandle", keywords: ["dribbble", "dribble"] },
    { label: "YouTube", prefix: "youtube.com/@", hint: "yourchannel", keywords: ["youtube"] },
    { label: "LinkedIn", prefix: "linkedin.com/in/", hint: "yourname", keywords: ["linkedin"] },
    { label: "Behance", prefix: "behance.net/", hint: "yourname", keywords: ["behance"] },
]

function getSuggestions(input: string) {
    const v = input.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/^www\./i, "")
    if (!v || v.includes("/")) return []
    return PLATFORM_SUGGESTIONS.filter(({ keywords, prefix }) => {
        const terms = [...keywords, prefix.split("/")[0]]
        return terms.some((t) => t.startsWith(v) || v.startsWith(t))
    })
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

// Mirrors src/lib/errors.ts: network failures and 5xx are "major" (full-page
// screen with Try again); everything else is "minor" (toast, in place).
const postJsonResult = async (path: string, body: any) => {
    let res
    try {
        res = await fetch(APP_URL + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
        })
    } catch {
        return { data: { error: "Network error" }, failure: { kind: "network", message: "Network error" } }
    }
    let data = {}
    try {
        data = await res.json()
    } catch {
        data = {}
    }
    const kind = res.status >= 500 ? "server" : res.status === 429 ? "rate_limit" : res.status >= 400 ? "client" : null
    const fieldMessages = Object.values(data || {}).flat().filter((v) => typeof v === "string")
    const message =
        data?.error || data?.detail || data?.message || (fieldMessages.length ? fieldMessages.join("\n") : "") ||
        "Something went wrong. Please try again."
    if (kind === null && !data?.error) return { data, failure: null }
    return { data, failure: { kind: kind || "client", message } }
}
const isMajorFailure = (failure) => failure?.kind === "network" || failure?.kind === "server"

// Full-page error (Figma 19960:71982). Same markup as src/components/errors/ErrorScreen.tsx.
function ErrorScreen({ onRetry }) {
    return (
        <div className="tf-err" role="alert">
            <div className="tf-err-inner">
                <div className="tf-err-iconBox" aria-hidden="true">
                    <div className="tf-err-iconWrap">
                        <img src={ERROR_ICON} alt="" className="tf-err-icon" />
                    </div>
                </div>
                <div className="tf-err-text">
                    <p className="tf-err-title">Something went wrong!</p>
                    <p className="tf-err-body">
                        We&apos;re having trouble loading Travingat right now. Please try again in a moment.
                    </p>
                </div>
                <div className="tf-err-actions">
                    <button type="button" onClick={onRetry} className="tf-err-retry">
                        Try again
                    </button>
                    {STATUS_PAGE_URL ? (
                        <a href={STATUS_PAGE_URL} target="_blank" rel="noopener noreferrer" className="tf-err-status">
                            Check system status
                        </a>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

const CheckCircle = ({ className, style }: { className?: string; style?: any }) => (
    <svg className={className} style={style} viewBox="0 0 16 16" fill="none" aria-label="Link looks good">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

// ---- Steps (mirror src/features/getfeatured/*) ----

const EmailIcon = () => (
    <div className="tf-iconBox">
        <img className="tf-iconImg" src={EMAIL_ICON} alt="Email Icon" loading="eager" />
    </div>
)

function EmailStep({ email, setEmail, onSendCode, isLoading, isValidEmail }) {
    const active = isValidEmail && !isLoading
    return (
        <div className="tf-card">
            <div className="tf-cardInner">
                <div className="tf-group">
                    <EmailIcon />
                    <p className="tf-title">Enter your email</p>
                    <div style={{ width: "100%" }}>
                        <div className="tf-emailWrap">
                            <input
                                id="email-input"
                                name="email"
                                type="email"
                                placeholder="e.g. james@email.com"
                                className="tf-emailInput"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && isValidEmail) {
                                        e.preventDefault()
                                        onSendCode()
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="tf-actions">
                    <button
                        className={`tf-btn ${active ? "tf-btnOn" : "tf-btnOff"}`}
                        disabled={!active}
                        onClick={onSendCode}
                    >
                        {isLoading ? "Sending..." : "Send code"}
                    </button>
                    <div className="tf-helper">
                        <p className="tf-desktopOnly">
                            {email.trim().length > 0 ? (
                                <>We&apos;ll send you a code to verify your email</>
                            ) : (
                                <>
                                    We&apos;ll verify your email before creating your
                                    <br />
                                    explorer card
                                </>
                            )}
                        </p>
                        <p className="tf-mobileOnly">We&apos;ll send you a code to verify your email</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function OtpStep({
    email, otp, inputRefs, isLoading, error, onOtpChange, onKeyDown, onPaste,
    onVerifyOtp, onResendCode, resendCooldown, onNotYou,
}) {
    const isOtpComplete = otp.every((d) => d.trim() !== "")
    const active = !isLoading && isOtpComplete
    return (
        <div className="tf-card">
            <div className="tf-cardInner">
                <div className="tf-group">
                    <EmailIcon />
                    <div className="tf-otpHeader">
                        <p className="tf-title">Verify your email</p>
                        <div className="tf-otpEmailRow">
                            <p className="tf-otpEmail">{email}</p>
                            <button type="button" onClick={onNotYou} className="tf-notYou">
                                Not you?
                            </button>
                        </div>
                    </div>
                    <div className="tf-otpRow">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-input-${index}`}
                                name={`otp-input-${index}`}
                                ref={(el) => {
                                    inputRefs.current[index] = el
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={2}
                                value={digit}
                                onChange={(e) => onOtpChange(index, e.target.value)}
                                onKeyDown={(e) => onKeyDown(index, e)}
                                onPaste={onPaste}
                                className="tf-otpInput"
                            />
                        ))}
                    </div>
                </div>

                <div className="tf-actions">
                    <button
                        className={`tf-btn ${active ? "tf-btnOn" : "tf-btnOff"}`}
                        disabled={!active}
                        onClick={onVerifyOtp}
                    >
                        {isLoading ? "Verifying..." : "Verify"}
                    </button>
                    {error && <div className="tf-otpError">{error}</div>}
                    <button
                        onClick={onResendCode}
                        disabled={isLoading || resendCooldown > 0}
                        className="tf-resend"
                    >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function LinkAutocomplete({
    linkInput, setLinkInput, links, isLinkInputValid, linkInputErrorMessage,
    setLinks, setLinkCheckResults, disabled,
}) {
    const [focused, setFocused] = useState(false)
    const [checkStatus, setCheckStatus] = useState("idle")
    const [highlightedIdx, setHighlightedIdx] = useState(-1)
    const blurTimerRef = useRef<any>(null)
    const checkTimerRef = useRef<any>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Debounced "does this link exist" check on the link being typed.
    useEffect(() => {
        setCheckStatus("idle")
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
        const v = linkInput.trim()
        if (!v || !isLinkInputValid) return
        checkTimerRef.current = setTimeout(async () => {
            setCheckStatus("checking")
            setCheckStatus(await checkLinkExists(v))
        }, 1500)
        return () => {
            if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
        }
    }, [linkInput, isLinkInputValid])

    const suggestions = focused ? getSuggestions(linkInput) : []
    const showDropdown = suggestions.length > 0

    useEffect(() => {
        setHighlightedIdx(-1)
    }, [linkInput])

    const canAdd =
        linkInput.trim().length > 0 && isLinkInputValid && links.length < 3 && !links.includes(linkInput.trim())

    const addLink = () => {
        if (!canAdd) return
        const url = linkInput.trim()
        setLinks((prev) => [...prev, url])
        setLinkCheckResults((prev) => ({ ...prev, [url]: checkStatus }))
        setLinkInput("")
        setCheckStatus("idle")
    }

    const pickSuggestion = (prefix: string) => {
        setLinkInput(prefix)
        setHighlightedIdx(-1)
        setFocused(true)
        setTimeout(() => inputRef.current?.focus(), 0)
    }

    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative", width: "100%" }}>
                <div
                    className={`tf-f-inputWithButton${focused ? " tf-f-inputWithButtonFocused" : ""}${showDropdown ? " tf-f-inputWithButtonOpen" : ""}`}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={links.length >= 3 ? "Maximum 3 links reached" : "e.g. instagram.com/username"}
                        className="tf-f-textInputNoBorder"
                        value={linkInput}
                        maxLength={100}
                        disabled={disabled}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onFocus={() => {
                            if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
                            setFocused(true)
                        }}
                        onBlur={() => {
                            blurTimerRef.current = setTimeout(() => setFocused(false), 150)
                        }}
                        onKeyDown={(e) => {
                            if (showDropdown) {
                                if (e.key === "ArrowDown") {
                                    e.preventDefault()
                                    setHighlightedIdx((i) => Math.min(i + 1, suggestions.length - 1))
                                    return
                                }
                                if (e.key === "ArrowUp") {
                                    e.preventDefault()
                                    setHighlightedIdx((i) => Math.max(i - 1, -1))
                                    return
                                }
                                if (e.key === "Tab" || e.key === "Enter") {
                                    e.preventDefault()
                                    pickSuggestion(suggestions[highlightedIdx >= 0 ? highlightedIdx : 0].prefix)
                                    return
                                }
                                if (e.key === "Escape") {
                                    setFocused(false)
                                    return
                                }
                            }
                            if (e.key === "Enter") {
                                e.preventDefault()
                                addLink()
                            }
                        }}
                    />

                    {checkStatus === "checking" && <div className="tf-f-linkCheckSpinner" title="Checking link…" />}
                    {checkStatus === "ok" && <CheckCircle className="tf-f-linkCheckOk" />}

                    <button
                        className={`tf-f-addLinkBtn${canAdd ? " tf-f-addLinkBtnActive" : ""}`}
                        disabled={!canAdd}
                        onClick={addLink}
                    >
                        Add
                    </button>
                </div>

                {showDropdown && (
                    <div className="tf-f-suggestions">
                        {suggestions.map(({ label, prefix, hint }, idx) => (
                            <div
                                key={prefix}
                                className={`tf-f-suggestionItem${idx === highlightedIdx ? " tf-f-suggestionItemHighlighted" : ""}`}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    pickSuggestion(prefix)
                                }}
                                onMouseEnter={() => setHighlightedIdx(idx)}
                                onMouseLeave={() => setHighlightedIdx(-1)}
                            >
                                <span className="tf-f-suggestionLabel">{label}</span>
                                <span className="tf-f-suggestionHint">
                                    {prefix}
                                    <span className="tf-f-suggestionPlaceholder">{hint}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!isLinkInputValid && (
                <div className="tf-f-linkHint">
                    {linkInputErrorMessage ||
                        "Enter a full link, e.g. instagram.com/username or flickr.com/photos/username"}
                </div>
            )}
        </div>
    )
}

// Mirrors InfoTooltip (src/components/ui/InfoTooltip.tsx): opens on hover,
// keyboard focus or tap. The bubble is portalled to <body> because the form
// card clips its overflow.
function InfoTooltip({ title, children }) {
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState(null)
    const buttonRef = useRef(null)
    const bubbleRef = useRef(null)
    const timer = useRef(null)
    const wasOpenOnPress = useRef(false)
    const pressedByTouch = useRef(false)
    const id = useId()

    const show = (next, delay = 0) => {
        clearTimeout(timer.current)
        if (delay) timer.current = setTimeout(() => setOpen(next), delay)
        else setOpen(next)
    }
    useEffect(() => () => clearTimeout(timer.current), [])

    // Above the icon, or below it when there's no room; 16px from the edges.
    useLayoutEffect(() => {
        if (!open) return setPosition(null)
        const icon = buttonRef.current.getBoundingClientRect()
        const { offsetWidth: width, offsetHeight: height } = bubbleRef.current
        const center = icon.left + icon.width / 2
        const maxLeft = document.documentElement.clientWidth - width - 16
        const left = Math.max(16, Math.min(center - width / 2, maxLeft))
        const below = icon.top - height - 12 < 16
        setPosition({
            left,
            top: below ? icon.bottom + 12 : icon.top - height - 12,
            arrow: center - left,
            below,
        })
    }, [open])

    useEffect(() => {
        if (!open) return
        const close = () => setOpen(false)
        const onPointerDown = (e) => {
            if (!buttonRef.current?.contains(e.target) && !bubbleRef.current?.contains(e.target)) close()
        }
        const onKeyDown = (e) => e.key === "Escape" && close()
        document.addEventListener("pointerdown", onPointerDown)
        document.addEventListener("keydown", onKeyDown)
        window.addEventListener("scroll", close, true)
        window.addEventListener("resize", close)
        return () => {
            document.removeEventListener("pointerdown", onPointerDown)
            document.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("scroll", close, true)
            window.removeEventListener("resize", close)
        }
    }, [open])

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label={title}
                aria-describedby={open ? id : undefined}
                className="tf-info"
                onPointerEnter={(e) => e.pointerType !== "touch" && show(true, 100)}
                onPointerLeave={(e) => e.pointerType !== "touch" && show(false, 100)}
                onPointerDown={(e) => {
                    e.preventDefault()
                    wasOpenOnPress.current = open
                    pressedByTouch.current = e.pointerType === "touch"
                }}
                onClick={(e) => {
                    e.preventDefault()
                    show(!(pressedByTouch.current && wasOpenOnPress.current))
                    pressedByTouch.current = false
                }}
                onFocus={() => show(true)}
                onBlur={() => show(false)}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="8" r="1" fill="currentColor" />
                </svg>
            </button>
            {open &&
                createPortal(
                    <div
                        ref={bubbleRef}
                        id={id}
                        role="tooltip"
                        className="tf-tip"
                        style={position ? { left: position.left, top: position.top } : { visibility: "hidden" }}
                        onPointerEnter={() => clearTimeout(timer.current)}
                        onPointerLeave={(e) => e.pointerType !== "touch" && show(false, 100)}
                    >
                        <div className="tf-tipTitle">{title}</div>
                        <div className="tf-tipBody">{children}</div>
                        {position && (
                            <span
                                className={`tf-tipArrow${position.below ? " tf-tipArrowUp" : ""}`}
                                style={{ left: position.arrow }}
                            />
                        )}
                    </div>,
                    document.body
                )}
        </>
    )
}

function FormStep({
    email, firstName, setFirstName, lastName, setLastName, selectedCountry, setSelectedCountry,
    visitedCount, setVisitedCount, linkInput, setLinkInput, links, setLinks, linkCheckResults,
    setLinkCheckResults, isDropdownOpen, setIsDropdownOpen, countrySearchQuery, setCountrySearchQuery,
    filteredCountries, isAppValid, isVisitedCountOverLimit, isLinkInputValid, linkInputErrorMessage,
    isLoading, signedIn, onLogout, onSubmitApplication,
}) {
    const nameOnly = (v: string) => v.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ '\-]/g, "")
    return (
        <div className="tf-f-parent">
            <div className="tf-f-field">
                <div className="tf-f-label">
                    Full name
                    <InfoTooltip title="Full name">
                        You can use your real name or a preferred name. Both fields are required for our profile designs.
                    </InfoTooltip>
                </div>
                <div className="tf-f-row">
                    <input
                        type="text"
                        placeholder="First name"
                        className="tf-f-textInput"
                        maxLength={30}
                        value={firstName}
                        onChange={(e) => setFirstName(nameOnly(e.target.value))}
                    />
                    <input
                        type="text"
                        placeholder="Last name"
                        className="tf-f-textInput"
                        maxLength={30}
                        value={lastName}
                        onChange={(e) => setLastName(nameOnly(e.target.value))}
                    />
                </div>
            </div>

            <div className="tf-f-field">
                <div className="tf-f-label">Email</div>
                <div className="tf-f-row">
                    <input type="email" value={email} disabled className="tf-f-textInput" />
                </div>
                {signedIn && (
                    <div className="tf-f-signedIn">
                        <span>Signed in as {email}</span>
                        <button type="button" onClick={onLogout}>
                            Not you?
                        </button>
                    </div>
                )}
            </div>

            <div className="tf-f-field">
                <div className="tf-f-label">Where are you from?</div>
                <div className="tf-f-row">
                    <div className="tf-f-selectWrapper">
                        {!isDropdownOpen ? (
                            <>
                                <div className="tf-f-selectInput" onClick={() => setIsDropdownOpen(true)}>
                                    {selectedCountry ? (
                                        <>
                                            <span className={`fi fi-${selectedCountry.toLowerCase()}`} />
                                            {countryOptions.find((c) => c.code === selectedCountry)?.name}
                                        </>
                                    ) : (
                                        <span style={{ color: "#525252" }}>Select country</span>
                                    )}
                                </div>
                                <img src={DROPDOWN_ICON} alt="Toggle Dropdown" width={24} height={24} className="tf-f-selectIcon" />
                            </>
                        ) : (
                            <div className="tf-f-search">
                                <div className="tf-f-searchIcon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z"
                                            fill="#7C7C7C"
                                        />
                                    </svg>
                                </div>
                                <div className="tf-f-searchDivider" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search country"
                                    value={countrySearchQuery}
                                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                                    className="tf-f-searchInput"
                                />
                            </div>
                        )}

                        {isDropdownOpen && (
                            <div className="tf-f-dropdownMenu">
                                {filteredCountries.map((country) => (
                                    <div
                                        key={country.code}
                                        className={`tf-f-dropdownItem${selectedCountry === country.code ? " tf-f-dropdownItemSelected" : ""}`}
                                        onClick={() => {
                                            setSelectedCountry(country.code)
                                            setIsDropdownOpen(false)
                                            setCountrySearchQuery("")
                                        }}
                                    >
                                        <span className={`fi fi-${country.code.toLowerCase()}`} />
                                        {country.name}
                                    </div>
                                ))}
                                {filteredCountries.length === 0 && (
                                    <div style={{ padding: "10px 16px", color: "#7C7C7C" }}>No countries found</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="tf-f-field">
                <div className="tf-f-label">How many countries have you visited?</div>
                <div className="tf-f-row">
                    <input
                        type="number"
                        placeholder="e.g. 10"
                        className={`tf-f-textInput${isVisitedCountOverLimit ? " tf-f-textInputError" : ""}`}
                        min={0}
                        value={visitedCount}
                        onChange={(e) => setVisitedCount(e.target.value)}
                    />
                </div>
                {isVisitedCountOverLimit && (
                    <div className="tf-f-inputError">
                        There are only {countryOptions.length} countries in the world — that number seems too high.
                    </div>
                )}
            </div>

            <div className="tf-f-field">
                <div className="tf-f-label">Share links to your travel photos</div>
                <div className="tf-f-row">
                    <LinkAutocomplete
                        linkInput={linkInput}
                        setLinkInput={setLinkInput}
                        links={links}
                        isLinkInputValid={isLinkInputValid}
                        linkInputErrorMessage={linkInputErrorMessage}
                        setLinks={setLinks}
                        setLinkCheckResults={setLinkCheckResults}
                        disabled={links.length >= 3}
                    />
                </div>

                {links.map((link, index) => (
                    <div key={index} className="tf-f-addedLinkBadge">
                        <div className="tf-f-addedLinkText">{link}</div>
                        {linkCheckResults[link] === "ok" && (
                            <CheckCircle style={{ width: 14, height: 14, color: "#4ade80", flexShrink: 0 }} />
                        )}
                        <div
                            className="tf-f-addedLinkRemoveBtn"
                            onClick={() => {
                                setLinks(links.filter((_, i) => i !== index))
                                setLinkCheckResults((prev) => {
                                    const n = { ...prev }
                                    delete n[link]
                                    return n
                                })
                            }}
                        >
                            <img src={CLOSE_ICON} alt="Remove link" width={8} height={8} />
                        </div>
                    </div>
                ))}
            </div>

            <button
                className={`tf-f-submitBtn${isAppValid && !isLoading ? " tf-f-submitBtnActive" : ""}`}
                disabled={!isAppValid || isLoading}
                onClick={onSubmitApplication}
            >
                {isLoading ? "Submitting..." : "Submit"}
            </button>

            <div className="tf-f-footer">
                Applications are reviewed manually. If selected, we&apos;ll email you a private upload link to
                create your travel profile before launch.
            </div>
        </div>
    )
}

function StatusStep({ variant, email, profileHandle, onUseDifferentEmail }) {
    const { title, body } = STATUS_COPY[variant]
    const illustrated = illustratedState(variant, profileHandle)

    // Illustration, message and a white CTA (Figma 19968:72031, 20070:75158).
    if (illustrated) {
        return (
            <div className="tf-s-panel">
                <div className="tf-s-content">
                    <img src={illustrated.icon} alt="" className="tf-s-icon" />
                    <div className="tf-s-text">
                        <p className="tf-s-title">{title}</p>
                        <p className="tf-s-body">{body}</p>
                        {variant !== "submitted" && email && <p className="tf-s-email">{email}</p>}
                    </div>
                    <div className="tf-s-ctaGroup">
                        <a href={illustrated.href} className="tf-s-cta">
                            {illustrated.action}
                        </a>
                        {illustrated.switchEmail && (
                            <button type="button" onClick={onUseDifferentEmail} className="tf-s-ctaSecondary">
                                {illustrated.switchEmail}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="tf-card tf-card-auto">
            <div className="tf-cardInner" style={{ textAlign: "center" }}>
                <div className="tf-s-badge">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#5a45f9" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <div className="tf-s-plainText">
                    <p className="tf-title">{title}</p>
                    <p className="tf-s-plainBody">{body}</p>
                    {email && <p className="tf-s-plainEmail">{email}</p>}
                </div>
                <div className="tf-s-buttons">
                    {variant === "reapply_limit" && (
                        <a
                            href="mailto:hello@travingat.com?subject=Featured%20Application%20Review%20Request"
                            className="tf-s-btn tf-s-btnPrimary"
                        >
                            Contact us
                        </a>
                    )}
                    <a href={APP_URL + "/"} className="tf-s-btn tf-s-btnDark">
                        Back to profiles
                    </a>
                    <button type="button" onClick={onUseDifferentEmail} className="tf-s-differentEmail">
                        Not you? Use a different email
                    </button>
                </div>
            </div>
        </div>
    )
}

// ---- Container (mirrors EmailVerificationForm) ----

const GetFeatured = () => {
    const [errorScreen, setErrorScreen] = useState<{ onRetry?: () => void } | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    const toastTimerRef = useRef<any>(null)

    const notifyError = (message: string) => {
        setToast(message)
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => setToast(null), 5000)
    }
    useEffect(() => () => clearTimeout(toastTimerRef.current), [])

    // Major failure -> full page + Try again; anything else -> toast.
    const reportFailure = (failure, onRetry?: () => void) => {
        if (isMajorFailure(failure)) setErrorScreen({ onRetry })
        else notifyError(failure.message)
    }

    return (
        <>
            <GetFeaturedFlow notifyError={notifyError} reportFailure={reportFailure} />
            {errorScreen && (
                <div className="tf-err-overlay">
                    <ErrorScreen
                        onRetry={() => {
                            const retry = errorScreen.onRetry
                            setErrorScreen(null)
                            if (retry) retry()
                            else window.location.reload()
                        }}
                    />
                </div>
            )}
            {toast && (
                <div className="tf-toast" role="alert">
                    {toast}
                </div>
            )}
        </>
    )
}

const GetFeaturedFlow = ({ notifyError, reportFailure }) => {
    const [email, setEmail] = useState("")
    const [signedIn, setSignedIn] = useState(false)
    const [statusVariant, setStatusVariant] = useState<StatusVariant | null>(null)
    const [profileHandle, setProfileHandle] = useState<string | undefined>(undefined)
    const [step, setStep] = useState<"email" | "otp" | "application" | "status">("email")
    const [otp, setOtp] = useState(["", "", "", ""])
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [countrySearchQuery, setCountrySearchQuery] = useState("")
    const [linkInput, setLinkInput] = useState("")
    const [links, setLinks] = useState<string[]>([])
    const [linkCheckResults, setLinkCheckResults] = useState<Record<string, string>>({})
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [visitedCount, setVisitedCount] = useState("")
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showBackWarning, setShowBackWarning] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const cooldownRef = useRef<any>(null)
    const suppressLeaveGuardRef = useRef(false)

    const bypassLeaveGuard = () => {
        suppressLeaveGuardRef.current = true
    }

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

    useEffect(() => () => clearInterval(cooldownRef.current), [])

    // Native "Leave site?" prompt while filling in the application.
    useEffect(() => {
        if (step !== "application") return
        const handler = (e: BeforeUnloadEvent) => {
            if (suppressLeaveGuardRef.current) return
            e.preventDefault()
            e.returnValue = ""
            return ""
        }
        window.addEventListener("beforeunload", handler)
        return () => window.removeEventListener("beforeunload", handler)
    }, [step])

    // Browser back on the OTP / application step shows the "Leave the page?"
    // modal instead of silently discarding progress.
    useEffect(() => {
        if (step !== "otp" && step !== "application") return
        window.history.pushState({ getfeaturedGuard: true }, "")
        const onPopState = () => {
            window.history.pushState({ getfeaturedGuard: true }, "")
            setShowBackWarning(true)
        }
        window.addEventListener("popstate", onPopState)
        return () => window.removeEventListener("popstate", onPopState)
    }, [step])

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
        if (bestCountry) setSelectedCountry(getInitialCountryCode(bestCountry) || bestCountry)

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

    // Returning visitors still signed in on the app see their status (or the
    // prefilled form), like /get-featured does with the server-side session.
    // Approved users with saved progress choose to continue; with nothing
    // saved yet they go straight into the builder. Silently ignored when the
    // cookie isn't sent.
    useEffect(() => {
        let cancelled = false
        // The approval email's link sends someone who has to verify here, with
        // their email after "#". Fill it in, then drop it from the address bar.
        const invited = new URLSearchParams(window.location.hash.slice(1)).get("email")
        if (invited) {
            setEmail(invited)
            window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search)
        }
        fetch(APP_URL + "/api/auth/me", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then(async (data) => {
                const u = data?.user
                if (cancelled || !u?.email) return
                setEmail(u.email)
                setSignedIn(true)
                let variant: StatusVariant | null = statusVariantFor(data.featured)
                if (variant === "continue") {
                    const approved = await fetchApprovedStatus()
                    if (cancelled) return
                    if (approved.variant === "start") {
                        window.location.href = BUILDER_URL
                        return
                    }
                    variant = approved.variant
                    setProfileHandle(approved.handle)
                }
                if (variant) {
                    setStatusVariant(variant)
                    setStep("status")
                    return
                }
                if (u.first_name) setFirstName(u.first_name)
                if (u.last_name) setLastName(u.last_name)
                const code = getInitialCountryCode(u.country)
                if (code) setSelectedCountry(code)
                if (u.visited_count != null) setVisitedCount(u.visited_count.toString())
                if (Array.isArray(u.links)) setLinks(u.links)
                setStep("application")
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [])

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const filteredCountries = countryOptions.filter((c) => searchCountry(c, countrySearchQuery))

    const linkValidation = validateLinkInput(linkInput)
    const isLinkInputValid = linkValidation.valid
    const linkInputErrorMessage = linkValidation.message

    const visitedCountNum = parseInt(visitedCount, 10)
    const isVisitedCountOverLimit =
        visitedCount !== "" && !isNaN(visitedCountNum) && visitedCountNum > countryOptions.length

    const isAppValid =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        selectedCountry !== null &&
        visitedCount !== "" &&
        !isVisitedCountOverLimit &&
        links.length > 0

    const handleSendCode = async () => {
        if (!isValidEmail) return
        setIsLoading(true)
        setError(null)

        // Always verify the email by OTP first. An application's status is
        // only shown after verify-otp succeeds (or to a valid session), so
        // typing someone else's address never reveals whether they applied.
        const result = await postJsonResult("/api/auth/request-otp", { email })
        setIsLoading(false)

        if (result.failure) {
            reportFailure(result.failure, handleSendCode)
            return
        }

        startResendCooldown(60)
        setStep("otp")
    }

    const handleResendCode = async () => {
        if (!isValidEmail || resendCooldown > 0) return
        setIsLoading(true)
        setError(null)
        const result = await postJsonResult("/api/auth/request-otp", { email })
        setIsLoading(false)

        if (result.failure) {
            startResendCooldown(result.data?.retry_after || 60)
            if (isMajorFailure(result.failure)) reportFailure(result.failure, handleResendCode)
            else setError(result.failure.message)
            return
        }
        startResendCooldown(60)
    }

    const handleVerifyOtp = async () => {
        setIsLoading(true)
        setError(null)
        const result = await postJsonResult("/api/auth/verify-otp", {
            email,
            otp: otp.join(""),
            source: "Get Featured",
        })
        if (result.failure) {
            setIsLoading(false)
            // Wrong code stays inline; an outage gets the full-page screen.
            if (isMajorFailure(result.failure)) reportFailure(result.failure, handleVerifyOtp)
            else setError(result.failure.message)
            return
        }
        const res = result.data

        const variant = statusVariantFor(res.featured)
        if (variant) {
            // Already applied or approved: don't ask them to apply again.
            // The button stays busy until the next screen is ready.
            await showStatus(variant)
            setIsLoading(false)
            return
        }
        setIsLoading(false)
        if (res.user || res.explorerCard) prefillFrom(res.user, res.explorerCard)
        setStep("application")
    }

    const showStatus = async (status: "continue" | "applied") => {
        let variant: StatusVariant = status
        if (status === "continue") {
            const approved = await fetchApprovedStatus()
            if (approved.variant === "start") {
                // Approved with nothing saved yet: straight into the builder.
                bypassLeaveGuard()
                window.location.href = BUILDER_URL
                return
            }
            setProfileHandle(approved.handle)
            variant = approved.variant
        }
        setStatusVariant(variant)
        setStep("status")
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
        if (pastedData) {
            const newOtp = [...otp]
            for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i]
            setOtp(newOtp)
            inputRefs.current[Math.min(pastedData.length, 3)]?.focus()
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        setError(null)
        const digits = value.replace(/\D/g, "")
        if (!digits && value) return
        const newOtp = [...otp]
        const lastChar = digits.slice(-1)
        newOtp[index] = lastChar
        setOtp(newOtp)
        if (lastChar && index < otp.length - 1) inputRefs.current[index + 1]?.focus()
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus()
        if (e.key === "Enter") handleVerifyOtp()
    }

    // "Apply with a different email" / "Not you?": end the session and go
    // back to a blank email step so the next address starts a fresh OTP.
    const handleLogout = () => {
        // Reset the screen first so the button responds immediately, even if
        // the sign-out request is slow or fails (cross-site cookies).
        postJson("/api/auth/logout-user", {})
        setSignedIn(false)
        setStatusVariant(null)
        setProfileHandle(undefined)
        setError(null)
        setIsLoading(false)
        setResendCooldown(0)
        setStep("email")
        setEmail("")
        setOtp(["", "", "", ""])
        setFirstName("")
        setLastName("")
        setVisitedCount("")
        setLinks([])
        setLinkCheckResults({})
        setSelectedCountry(null)
    }

    const handleSubmitApplication = async () => {
        setIsLoading(true)
        const validLinks = links
            .filter((l) => l && l.trim().length > 0)
            .map((l) => (l.startsWith("http://") || l.startsWith("https://") ? l.trim() : `https://${l.trim()}`))

        const result = await postJsonResult("/api/auth/submit-application", {
            firstName,
            lastName,
            country: selectedCountry || "Unknown",
            visitedCount: Number(visitedCount),
            links: validLinks,
            link_statuses: linkCheckResults,
        })
        setIsLoading(false)
        const res = result.data

        if (isMajorFailure(result.failure)) {
            // The application stays filled in behind the screen; Try again resubmits.
            reportFailure(result.failure, handleSubmitApplication)
            return
        }

        if (!res.success) {
            if (res.reapplyLimitReached) {
                setStatusVariant("reapply_limit")
                setStep("status")
                return
            }
            notifyError(result.failure?.message || "Submission failed. Please try again.")
            return
        }

        // Stay on a confirmation screen instead of resetting to an empty
        // form, which made a reload look like they still had to apply.
        if (res.alreadyApplied) {
            await showStatus(statusVariantFor(res.featured) ?? "applied")
            return
        }
        setStatusVariant("submitted")
        setStep("status")
    }

    if (step === "status" && statusVariant) {
        return (
            <StatusStep
                variant={statusVariant}
                email={email}
                profileHandle={profileHandle}
                onUseDifferentEmail={handleLogout}
            />
        )
    }

    const backWarningModal = showBackWarning ? (
        <div className="tf-m-overlay">
            <div className="tf-m-box">
                <div className="tf-m-text">
                    <h2 className="tf-m-title">Leave the page?</h2>
                    <p className="tf-m-body">
                        {step === "otp"
                            ? "If you go back now you'll need to request a new code."
                            : "Your application progress will be lost if you leave."}
                    </p>
                </div>
                <div className="tf-m-buttons">
                    <button
                        onClick={() => {
                            setShowBackWarning(false)
                            bypassLeaveGuard()
                            window.history.go(-2)
                        }}
                        className="tf-m-leave"
                    >
                        Leave
                    </button>
                    <button onClick={() => setShowBackWarning(false)} className="tf-m-stay">
                        Stay
                    </button>
                </div>
            </div>
        </div>
    ) : null

    if (step === "otp") {
        return (
            <>
                {backWarningModal}
                <OtpStep
                    email={email}
                    otp={otp}
                    inputRefs={inputRefs}
                    isLoading={isLoading}
                    error={error}
                    onOtpChange={handleOtpChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onVerifyOtp={handleVerifyOtp}
                    onResendCode={handleResendCode}
                    resendCooldown={resendCooldown}
                    onNotYou={() => {
                        setStep("email")
                        setOtp(["", "", "", ""])
                        setError(null)
                    }}
                />
            </>
        )
    }

    if (step === "application") {
        return (
            <>
                {backWarningModal}
                <FormStep
                    email={email}
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    visitedCount={visitedCount}
                    setVisitedCount={setVisitedCount}
                    linkInput={linkInput}
                    setLinkInput={setLinkInput}
                    links={links}
                    setLinks={setLinks}
                    linkCheckResults={linkCheckResults}
                    setLinkCheckResults={setLinkCheckResults}
                    isDropdownOpen={isDropdownOpen}
                    setIsDropdownOpen={setIsDropdownOpen}
                    countrySearchQuery={countrySearchQuery}
                    setCountrySearchQuery={setCountrySearchQuery}
                    filteredCountries={filteredCountries}
                    isAppValid={isAppValid}
                    isVisitedCountOverLimit={isVisitedCountOverLimit}
                    isLinkInputValid={isLinkInputValid}
                    linkInputErrorMessage={linkInputErrorMessage}
                    isLoading={isLoading}
                    signedIn={signedIn}
                    onLogout={handleLogout}
                    onSubmitApplication={handleSubmitApplication}
                />
            </>
        )
    }

    return (
        <EmailStep
            email={email}
            setEmail={setEmail}
            onSendCode={handleSendCode}
            isLoading={isLoading}
            isValidEmail={isValidEmail}
        />
    )
}

// ---- Styles ----
// Breakpoints match Tailwind: sm = 640px, lg = 1024px. Resets use :where()
// (zero specificity) to mirror Tailwind's preflight without beating classes.
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600&display=swap");
@import url("https://cdn.jsdelivr.net/npm/flag-icons@7.6.0/css/flag-icons.min.css");

@font-face {
  font-family: "Inter Display";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("https://cdn.jsdelivr.net/npm/inter-ui@4.1.0/display/InterDisplay-Regular.woff2") format("woff2");
}
@font-face {
  font-family: "Inter Display";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("https://cdn.jsdelivr.net/npm/inter-ui@4.1.0/display/InterDisplay-Medium.woff2") format("woff2");
}

.tf-root {
  --tf-display: "Inter Display", Inter, "Segoe UI", sans-serif;
  --tf-body: Inter, "Segoe UI", sans-serif;
  width: 100%;
  font-family: var(--tf-body);
  line-height: 1.5;
  color: #fff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
:where(.tf-root) *, :where(.tf-root) *::before, :where(.tf-root) *::after {
  box-sizing: border-box;
  border: 0 solid;
  margin: 0;
  padding: 0;
}
:where(.tf-root) :is(button, input) {
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  background-color: transparent;
  border-radius: 0;
  opacity: 1;
}
:where(.tf-root) :is(img, svg) { display: block; vertical-align: middle; }
:where(.tf-root) img { max-width: 100%; height: auto; }
:where(.tf-root) a { color: inherit; text-decoration: inherit; }
/* The app's globals.css @layer base typography. */
:where(.tf-root) p {
  font-family: var(--tf-body);
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.006em;
  font-weight: 400;
}
:where(.tf-root) :is(a, button) { cursor: pointer; }
:where(.tf-root) button:disabled { cursor: default; }

/* ---- Email / OTP card (GetFeaturedEmailStep, GetFeaturedOtpStep) ---- */
.tf-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 100%;
  max-width: 420px;
  height: auto;
  margin: 0 auto;
  overflow: hidden;
  background: transparent;
}
.tf-cardInner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  padding: 24px;
  flex-shrink: 0;
}
@media (min-width: 640px) {
  .tf-cardInner { padding: 32px; }
}
@media (min-width: 1024px) {
  .tf-card { background: #111; height: 563px; justify-content: center; border-radius: 20px; }
  .tf-card.tf-card-auto { height: auto; }
}
.tf-group {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  flex-shrink: 0;
}
.tf-actions {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  flex-shrink: 0;
}
.tf-iconBox {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 16.81px;
  flex-shrink: 0;
}
.tf-iconImg {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.tf-title {
  min-width: 100%;
  font-family: var(--tf-display);
  font-weight: 500;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: -0.5px;
  text-align: center;
  color: #fff;
}
.tf-emailWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: border-color 0.15s;
}
.tf-emailInput {
  width: 100%;
  font-family: var(--tf-display);
  font-weight: 400;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: -0.5px;
  text-align: center;
  color: #fff;
  background: transparent;
  outline: none;
}
.tf-emailInput::placeholder { color: #2a2a2a; opacity: 1; }
.tf-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 16px;
  border-radius: 9999px;
  font-family: var(--tf-body);
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.154px;
  transition: all 0.15s;
}
.tf-btnOn { background: #5a45f9; color: #fff; cursor: pointer; }
.tf-btnOn:hover { opacity: 0.9; }
.tf-btnOff { background: #c0caff; color: #ecf0ff; cursor: not-allowed; }
.tf-helper {
  width: 100%;
  text-align: center;
  color: #7c7c7c;
  font-family: var(--tf-body);
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.084px;
}
.tf-desktopOnly { display: none; }
.tf-mobileOnly { display: block; white-space: nowrap; }
@media (min-width: 1024px) {
  .tf-desktopOnly { display: block; }
  .tf-mobileOnly { display: none; }
}
.tf-otpHeader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 100%;
}
.tf-otpEmailRow { display: flex; align-items: center; gap: 6px; }
.tf-otpEmail, .tf-notYou {
  font-family: var(--tf-body);
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.084px;
  text-align: center;
  color: #989898;
}
.tf-notYou { color: #5a45f9; cursor: pointer; transition: opacity 0.15s; }
.tf-notYou:hover { opacity: 0.8; }
.tf-otpRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding-top: 8px;
}
.tf-otpInput {
  width: 62px;
  height: 60px;
  background: #000;
  border: 1px solid #252525;
  border-radius: 10px;
  text-align: center;
  font-family: var(--tf-display);
  font-weight: 400;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: -0.5px;
  color: #fff;
  outline: none;
  transition: border-color 0.15s;
}
.tf-otpInput:focus { border-color: #fff; }
.tf-otpError {
  margin-top: -12px;
  text-align: center;
  color: #ef4444;
  font-size: 14px;
  line-height: 20px;
}
.tf-resend {
  font-family: var(--tf-body);
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.084px;
  text-align: center;
  color: #7c7c7c;
  cursor: pointer;
  transition: color 0.15s;
}
.tf-resend:hover { color: #fff; }
.tf-resend:disabled { opacity: 0.5; cursor: not-allowed; }

/* ---- Application form (GetFeaturedFormStep + form.module.css) ---- */
.tf-f-parent {
  width: 100%;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 32px;
  background-color: #111111;
  overflow: hidden;
  border-radius: 20px;
  gap: 20px;
}
.tf-f-field {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 10px;
}
.tf-f-label {
  align-self: stretch;
  color: white;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
  text-align: left;
}
.tf-info {
  position: relative;
  display: inline-flex;
  width: 16px;
  height: 16px;
  margin: 2px 0 0 6px;
  vertical-align: top;
  color: #7c7c7c;
  cursor: pointer;
  transition: color 0.15s;
}
.tf-info:hover { color: #fff; }
.tf-info::after { content: ""; position: absolute; inset: -8px; }
.tf-tip {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-sizing: border-box;
  width: 300px;
  max-width: calc(100vw - 32px);
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  color: #161616;
  font-family: Inter, "Segoe UI", sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  text-align: left;
  box-shadow: 0 12px 16px rgba(16, 24, 40, 0.08), 0 4px 6px rgba(16, 24, 40, 0.03);
}
.tf-tipTitle { margin-bottom: 8px; font-weight: 700; }
.tf-tipBody { color: #576072; }
.tf-tipArrow {
  position: absolute;
  top: 100%;
  width: 16px;
  height: 6px;
  margin-left: -8px;
  background: #fff;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}
.tf-tipArrowUp { top: auto; bottom: 100%; transform: rotate(180deg); }
.tf-f-row {
  align-self: stretch;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
}
.tf-f-textInput {
  flex: 1 1 0;
  min-width: 0;
  padding: 12px 16px;
  background-color: black;
  border-radius: 10px;
  border: 1px solid #1E1E1E;
  color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  outline: none;
  width: 100%;
}
.tf-f-textInput[type=number]::-webkit-outer-spin-button,
.tf-f-textInput[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.tf-f-textInput[type=number] { -moz-appearance: textfield; }
.tf-f-textInput::placeholder { color: #525252; opacity: 1; }
.tf-f-textInput:focus { border-color: #525252; }
.tf-f-textInput:disabled { color: #525252; }
.tf-f-textInputError { border-color: #5a45f9 !important; }
.tf-f-inputError {
  color: #a08fff;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  margin-top: -4px;
}
.tf-f-signedIn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: #989898;
}
.tf-f-signedIn button { color: #5a45f9; cursor: pointer; font-size: 12px; }
.tf-f-inputWithButton {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 12px 16px;
  background-color: black;
  border-radius: 10px;
  border: 1px solid #1E1E1E;
}
.tf-f-inputWithButton:focus-within, .tf-f-inputWithButtonFocused { border-color: #525252; }
.tf-f-inputWithButtonOpen {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-color: #525252;
}
.tf-f-textInputNoBorder {
  flex: 1 1 0;
  min-width: 0;
  background-color: transparent;
  color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  outline: none;
}
.tf-f-textInputNoBorder::placeholder { color: #525252; opacity: 1; }
.tf-f-addLinkBtn {
  padding: 8px 12px;
  background-color: #1A1A1A;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid #353535;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: #3D3D3D;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tf-f-addLinkBtnActive { color: #161616; background-color: white; }
.tf-f-linkHint {
  width: 100%;
  color: #989898;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  word-wrap: break-word;
  margin-top: 4px;
}
.tf-f-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #111;
  border: 1px solid #525252;
  border-top: none;
  border-radius: 0 0 10px 10px;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
.tf-f-suggestionItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.tf-f-suggestionItem:hover, .tf-f-suggestionItemHighlighted { background-color: #1e1e1e; }
.tf-f-suggestionLabel {
  color: white;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  min-width: 72px;
}
.tf-f-suggestionHint {
  color: #525252;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tf-f-suggestionPlaceholder { color: #3d3d3d; }
.tf-f-linkCheckSpinner {
  width: 14px;
  height: 14px;
  border: 2px solid #333;
  border-top-color: #7c7c7c;
  border-radius: 50%;
  animation: tf-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes tf-spin { to { transform: rotate(360deg); } }
.tf-f-linkCheckOk { width: 14px; height: 14px; color: #4ade80; flex-shrink: 0; }
.tf-f-selectWrapper { position: relative; flex: 1 1 0; display: flex; }
.tf-f-selectInput {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 40px 12px 16px;
  background-color: black;
  border-radius: 10px;
  border: 1px solid #1E1E1E;
  color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
}
.tf-f-selectIcon {
  width: 24px;
  height: 24px;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.tf-f-search {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: black;
  border-radius: 10px;
  outline: 1px #989898 solid;
  outline-offset: -1px;
}
.tf-f-searchIcon {
  width: 24px;
  height: 24px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tf-f-searchDivider { width: 1px; height: 24px; background: white; opacity: 0.2; }
.tf-f-searchInput {
  width: 100%;
  background: transparent;
  outline: none;
  color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}
.tf-f-dropdownMenu {
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
.tf-f-dropdownItem {
  padding: 10px 16px;
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tf-f-dropdownItem:hover { background-color: #353535; }
.tf-f-dropdownItemSelected { background-color: #5A45F9; }
.tf-f-submitBtn {
  align-self: stretch;
  padding: 10px 18px;
  background-color: #C0CAFF;
  border-radius: 999px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ECF0FF;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tf-f-submitBtn:disabled { cursor: default; }
.tf-f-submitBtnActive { background-color: #5A45F9; color: white; }
.tf-f-addedLinkBadge {
  width: 100%;
  padding: 6px 6px 6px 10px;
  background-color: #1E1E1E;
  border-radius: 8px;
  border: 1px solid #252525;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}
.tf-f-addedLinkText {
  flex: 1 1 0;
  min-width: 0;
  color: white;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  word-wrap: break-word;
  text-align: left;
}
.tf-f-addedLinkRemoveBtn {
  padding: 6px;
  background-color: #404040;
  border-radius: 99px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.tf-f-addedLinkRemoveBtn:hover { background-color: #525252; }
.tf-f-footer {
  align-self: stretch;
  text-align: center;
  color: white;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

/* ---- Status (GetFeaturedStatusStep) ---- */
.tf-s-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 100%;
  overflow: hidden;
  background: transparent;
}
@media (min-width: 1024px) {
  /* Figma "Form": 500px-wide #111 panel (height follows the content, never fixed), centred over the 448px column. */
  .tf-s-panel {
    background: #111;
    border-radius: 20px;
    width: 500px;
    max-width: none;
    padding: 0 32px 32px;
    left: 50%;
    transform: translateX(-50%);
  }
}
.tf-s-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  padding: 32px;
}
.tf-s-icon {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
}
.tf-s-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  text-align: center;
}
.tf-s-title {
  width: 100%;
  font-family: var(--tf-display);
  font-weight: 500;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: -0.5px;
  color: #fff;
}
.tf-s-body, .tf-s-email {
  width: 100%;
  font-family: var(--tf-body);
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.084px;
  color: #fff;
}
.tf-s-email { color: #656565; word-break: break-all; }
.tf-s-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 32px;
  border-radius: 9999px;
  background: #fff;
  font-family: var(--tf-body);
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.096px;
  color: #000;
  transition: background-color 0.15s;
}
.tf-s-cta:hover { background: #eaeaea; }
.tf-s-ctaGroup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}
.tf-s-ctaSecondary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 9999px;
  font-family: var(--tf-body);
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.096px;
  color: #989898;
  cursor: pointer;
  transition: color 0.15s;
}
.tf-s-ctaSecondary:hover { color: #fff; }
/* Full-page error (Figma 19960:71982) + toast. Mirrors src/components/errors/. */
.tf-err-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  overflow-y: auto;
  background: #000;
}
.tf-err {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: #000;
  padding: 0 16px;
  user-select: none;
}
.tf-err-inner {
  width: 100%;
  max-width: 647px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px;
}
@media (min-width: 640px) { .tf-err-inner { padding: 48px; } }
.tf-err-iconBox { position: relative; width: 160px; height: 160px; flex-shrink: 0; overflow: hidden; }
.tf-err-iconWrap {
  position: absolute;
  left: calc(50% + 2.8px);
  top: -10.8px;
  width: 239px;
  height: 191.268px;
  transform: translateX(-50%);
  overflow: hidden;
  pointer-events: none;
}
.tf-err-icon { position: absolute; left: -19.18%; top: -25.04%; width: 138.36%; height: 158%; max-width: none; }
.tf-err-text { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; max-width: 480px; text-align: center; word-break: break-word; }
.tf-err-title { font-family: var(--tf-display); font-weight: 500; font-size: 24px; line-height: 32px; letter-spacing: -0.5px; color: #fff; margin: 0; }
.tf-err-body { font-family: var(--tf-body); font-size: 16px; line-height: 24px; letter-spacing: -0.096px; color: #989898; margin: 0; }
.tf-err-actions { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.tf-err-retry {
  padding: 12px 28px;
  border-radius: 9999px;
  background: #fff;
  color: #000;
  font-family: var(--tf-body);
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.096px;
  cursor: pointer;
  transition: background-color 0.15s;
}
.tf-err-retry:hover { background: #dcdcdc; }
.tf-err-status {
  width: 180px;
  padding: 12px 24px;
  border-radius: 9999px;
  text-align: center;
  white-space: nowrap;
  font-family: var(--tf-body);
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.096px;
  color: #989898;
  transition: color 0.15s;
}
.tf-err-status:hover { color: #fff; }
.tf-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483001;
  max-width: calc(100vw - 32px);
  padding: 12px 16px;
  border-radius: 12px;
  background: #161616;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fff;
  font-family: var(--tf-body);
  font-size: 14px;
  line-height: 20px;
  box-shadow: 0 12px 16px rgba(16, 24, 40, 0.3);
}
.tf-s-badge {
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tf-s-plainText { display: flex; flex-direction: column; gap: 8px; }
.tf-s-plainBody {
  font-family: var(--tf-body);
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.084px;
  color: #989898;
}
.tf-s-plainEmail {
  font-family: var(--tf-body);
  font-size: 12px;
  line-height: 16px;
  color: #7c7c7c;
  word-break: break-all;
}
.tf-s-buttons { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.tf-s-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 16px;
  border-radius: 9999px;
  font-family: var(--tf-body);
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #fff;
  transition: background-color 0.15s, opacity 0.15s;
}
.tf-s-btnPrimary { background: #5a45f9; }
.tf-s-btnPrimary:hover { opacity: 0.9; }
.tf-s-btnDark { background: #1a1a1a; }
.tf-s-btnDark:hover { background: #232323; }
.tf-s-differentEmail {
  font-family: var(--tf-body);
  font-size: 14px;
  line-height: 20px;
  color: #7c7c7c;
  cursor: pointer;
  transition: color 0.15s;
}
.tf-s-differentEmail:hover { color: #fff; }

/* ---- "Leave the page?" modal ---- */
.tf-m-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background: rgba(0, 0, 0, 0.7);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.tf-m-box {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 360px;
  padding: 24px;
  background: #111111;
  border: 1px solid #2a2a2a;
  border-radius: 20px;
}
.tf-m-text { display: flex; flex-direction: column; gap: 8px; }
.tf-m-title {
  font-family: var(--tf-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: #fff;
}
.tf-m-body { font-family: var(--tf-body); font-size: 14px; line-height: 1.5; color: #989898; }
.tf-m-buttons { display: flex; flex-direction: column; gap: 12px; }
.tf-m-leave, .tf-m-stay {
  width: 100%;
  padding: 12px 20px;
  border-radius: 9999px;
  font-family: var(--tf-body);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s;
}
.tf-m-leave { background: #1a1a1a; border: 1px solid #353535; color: #fff; font-weight: 500; }
.tf-m-leave:hover { background: #252525; }
.tf-m-stay { background: #fff; color: #000; font-weight: 600; }
.tf-m-stay:hover { background: rgba(255, 255, 255, 0.9); }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 448
 */
export default function FramerFrontend(props) {
    return (
        <div className="tf-root" style={props.style}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <GetFeatured />
        </div>
    )
}
