"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Noto_Sans_JP } from "next/font/google";

type Axis = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

type CatType =
  | "規律番ねこ"
  | "よりそい守りねこ"
  | "しずか哲学ねこ"
  | "戦略きれものねこ"
  | "無口クラフトねこ"
  | "ふわアートねこ"
  | "ゆめふわロマンねこ"
  | "ひらめき遊びねこ"
  | "突撃アクティブねこ"
  | "きらきらパーティーねこ"
  | "わくわく自由ねこ"
  | "いたずら天才ねこ"
  | "しきり屋リーダーねこ"
  | "みんな大好きねこ"
  | "導きカリスマねこ"
  | "覇王ボスねこ";

type QuestionOption = {
  label: string;
  axis: Axis;
  weight: number;
};

type Segment = "EI" | "SN" | "TF" | "JP";

type Question = {
  id: number;
  text: string;
  segment: Segment;
  options: [QuestionOption, QuestionOption];
};

type GenderOption = "" | "male" | "female";
type CoatOption = "" | "white" | "black" | "gray" | "tabby" | "calico" | "brown" | "blackwhite";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});


const VISITOR_ID_STORAGE_KEY = "nekobti_visitor_id";
const SESSION_ID_STORAGE_KEY = "nekobti_session_id";

function safeUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (existing) return existing;

  const next = safeUuid();
  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, next);
  return next;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";

  const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const next = safeUuid();
  window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, next);
  return next;
}

function getTrackingMeta() {
  if (typeof window === "undefined") {
    return {
      session_id: "",
      visitor_id: "",
      page_path: "",
      page_url: "",
      referrer: null as string | null,
      utm_source: null as string | null,
      utm_medium: null as string | null,
      utm_campaign: null as string | null,
      user_agent: "",
      timezone: "",
    };
  }

  const url = new URL(window.location.href);

  return {
    session_id: getOrCreateSessionId(),
    visitor_id: getOrCreateVisitorId(),
    page_path: window.location.pathname,
    page_url: window.location.href,
    referrer: document.referrer || null,
    utm_source: url.searchParams.get("utm_source"),
    utm_medium: url.searchParams.get("utm_medium"),
    utm_campaign: url.searchParams.get("utm_campaign"),
    user_agent: navigator.userAgent || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  };
}

function shouldTrackOncePerSession(eventName: string, pagePath: string) {
  if (typeof window === "undefined") return false;

  const key = `nekobti_tracked:${eventName}:${pagePath}`;
  const alreadyTracked = window.sessionStorage.getItem(key) === "1";
  if (alreadyTracked) return false;

  window.sessionStorage.setItem(key, "1");
  return true;
}

type TrackEventExtra = Partial<{
  result_type: string;
  mbti: string;
  gender: string;
  coat: string;
}>;

type AnalyticsTrackPayload = ReturnType<typeof getTrackingMeta> & {
  event_name: string;
} & TrackEventExtra;

type CompatibilityItem = {
  type: string;
  label: string;
  hearts: number;
};

type TypeListItem = {
  type: CatType;
  emoji: string;
  description: string;
  percentage?: number;
};

type TypeListResponse = {
  ok: boolean;
  items?: TypeListItem[];
  error?: string;
};

type StartResponse = {
  ok: boolean;
  questions?: Question[];
  error?: string;
};

type AruaruSet = {
  text: string;
  quote: string;
};

type ServerDiagnosisResult = {
  mbti: string;
  mainType: CatType;
  closeSegments: Segment[];
  tiedSegments: Segment[];
  decisiveQuestionId: number | null;
  selectedAruaru: AruaruSet | null;
  cardCopy: string;
  emoji: string;
  description: string;
  traits: string[];
  compatibility: CompatibilityItem[];
  bestMatch: string;
};

type FinalizePayload = ReturnType<typeof getTrackingMeta> & {
  gender: string;
  coat: string;
  current_questions: Question[];
  answers: (QuestionOption | null)[];
};

type FinalizeResponse = {
  ok: boolean;
  result?: ServerDiagnosisResult;
  typeShares?: Record<string, number>;
  error?: string;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}


const Paw = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-7 w-7 transition-colors duration-300 sm:h-8 sm:w-8 ${
      active ? "fill-[#b07d62]" : "fill-[#f3e8df]"
    }`}
    aria-hidden="true"
  >
    <circle cx="12" cy="15" r="4" />
    <circle cx="7" cy="9" r="1.8" />
    <circle cx="10.5" cy="6.5" r="1.8" />
    <circle cx="13.5" cy="6.5" r="1.8" />
    <circle cx="17" cy="9" r="1.8" />
  </svg>
);



function getResultImagePath(mbti: string, gender: GenderOption, coat: CoatOption) {
  if (!gender || !coat) return "/images/silhouette.png";
  return `/images/cats/${mbti}_${gender}_${coat}.png`;
}

function getResultTypeTitleClass(type: CatType) {
  const length = type.length;

  if (length >= 10) {
    return "text-[24px] sm:text-[34px]";
  }

  if (length >= 8) {
    return "text-[28px] sm:text-[38px]";
  }

  return "text-[28px] sm:text-[42px]";
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeListOpen, setIsTypeListOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(QuestionOption | null)[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAruaru, setSelectedAruaru] = useState<AruaruSet | null>(null);
  const [result, setResult] = useState<ServerDiagnosisResult | null>(null);
  const [cardCopy, setCardCopy] = useState("");
  const [selectedGender, setSelectedGender] = useState<GenderOption>("");
  const [selectedCoat, setSelectedCoat] = useState<CoatOption>("");
  const [resultImageSrc, setResultImageSrc] = useState("/images/silhouette.png");
  const [typeListItems, setTypeListItems] = useState<TypeListItem[]>([]);
  const [isLoadingTypeList, setIsLoadingTypeList] = useState(false);
  const [typeListError, setTypeListError] = useState<string | null>(null);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [isSharePreviewOpen, setIsSharePreviewOpen] = useState(false);
  const [isOpeningSharePreview, setIsOpeningSharePreview] = useState(false);
  const [isMobileClient, setIsMobileClient] = useState(false);
  const [isPreparingShareImage, setIsPreparingShareImage] = useState(false);
  const [isNativeSharing, setIsNativeSharing] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);
  const [shareImageError, setShareImageError] = useState<string | null>(null);
  const pageViewTrackedRef = useRef(false);
  const transitionLockRef = useRef(false);
  const stepTimerRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const justWentBackRef = useRef(false);

  const trackEvent = async (eventName: string, extra: TrackEventExtra = {}) => {
    const meta = getTrackingMeta();
    const payload: AnalyticsTrackPayload = {
      event_name: eventName,
      ...meta,
      result_type: extra.result_type ?? undefined,
      mbti: extra.mbti ?? undefined,
      gender: extra.gender ?? undefined,
      coat: extra.coat ?? undefined,
    };

    try {
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await readJsonSafely<{ error?: string }>(response);
        console.error(`event track failed: ${eventName}`, data?.error ?? response.statusText);
      }
    } catch (error) {
      console.error(`event track failed: ${eventName}`, error);
    }
  };

  const loadingMessages = useMemo(
    () => ["猫らしさを分析中...", "行動パターンを整理中...", "タイプを判定しています..."],
    []
  );

  useEffect(() => {
    if (isOpen || isTypeListOpen || isAboutOpen || isPrivacyOpen || isSharePreviewOpen || isOpeningSharePreview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isTypeListOpen, isAboutOpen, isPrivacyOpen, isSharePreviewOpen, isOpeningSharePreview]);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
      if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (shareImageUrl) {
        URL.revokeObjectURL(shareImageUrl);
      }
    };
  }, [shareImageUrl]);

  useEffect(() => {
    if (pageViewTrackedRef.current) return;

    const pagePath = typeof window !== "undefined" ? window.location.pathname : "/";
    if (!shouldTrackOncePerSession("page_view", pagePath)) {
      pageViewTrackedRef.current = true;
      return;
    }

    pageViewTrackedRef.current = true;
    void trackEvent("page_view");
  }, []);

  const totalQuestions = currentQuestions.length;
  const totalSteps = totalQuestions > 0 ? totalQuestions + 1 : 1;
  const answeredCount = answers.filter(Boolean).length;
  const isQuestionSetReady = totalQuestions > 0;
  const isAppearanceStep = isQuestionSetReady && step === totalQuestions;
  const currentQuestion = !isAppearanceStep ? currentQuestions[step] ?? null : null;

  useEffect(() => {
    if (!result) return;

    setResultImageSrc(getResultImagePath(result.mbti, selectedGender, selectedCoat));
  }, [result, selectedGender, selectedCoat]);


  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectMobile = () => {
      const ua = navigator.userAgent || "";
      const mobileByUa = /iPhone|Android.+Mobile|iPod|Windows Phone|webOS|BlackBerry/i.test(ua);
      const mobileByViewport = window.innerWidth <= 768 && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
      setIsMobileClient(mobileByUa || mobileByViewport);
    };

    detectMobile();
    window.addEventListener("resize", detectMobile);
    return () => window.removeEventListener("resize", detectMobile);
  }, []);

  const fetchQuestionSet = async () => {
    try {
      const response = await fetch("/api/diagnosis/start", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJsonSafely<StartResponse>(response);

      if (!response.ok || !data?.ok || !data.questions?.length) {
        console.error("question fetch failed:", data?.error ?? response.statusText);
        return null;
      }

      return data.questions;
    } catch (error) {
      console.error("question fetch failed:", error);
      return null;
    }
  };

  const resetDiagnosisUi = () => {
    setStep(0);
    setSelectedLabel(null);
    setAnimating(false);
    setDirection("next");
    setIsCalculating(false);
    setLoadingMessageIndex(0);
    setShowResult(false);
    setSelectedAruaru(null);
    setResult(null);
    setCardCopy("");
    setSelectedGender("");
    setSelectedCoat("");
    setResultImageSrc("/images/silhouette.png");
    setQuestionLoadError(null);
  };

  const prepareFreshDiagnosis = async () => {
    setIsLoadingQuestions(true);
    setQuestionLoadError(null);
    setCurrentQuestions([]);
    setAnswers([]);

    try {
      const nextQuestions = await fetchQuestionSet();

      if (!nextQuestions?.length) {
        setQuestionLoadError("質問の読み込みに失敗しました。時間をおいてもう一度お試しください。");
        return false;
      }

      setCurrentQuestions(nextQuestions);
      setAnswers(Array(nextQuestions.length).fill(null));
      return true;
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const openDiagnosis = async () => {
    void trackEvent("diagnosis_started");
    resetDiagnosisUi();
    setIsOpen(true);
    await prepareFreshDiagnosis();
  };

  const closeDiagnosis = () => {
    setIsOpen(false);
    setSelectedLabel(null);
    setAnimating(false);
    setIsCalculating(false);
    setIsLoadingQuestions(false);
    setLoadingMessageIndex(0);
    setShowResult(false);
    setResult(null);
    setCardCopy("");
    setSelectedAruaru(null);
    setQuestionLoadError(null);
  };

  const fetchTypeList = async () => {
    try {
      setIsLoadingTypeList(true);
      setTypeListError(null);

      const response = await fetch("/api/type-list", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJsonSafely<TypeListResponse>(response);

      if (!response.ok || !data?.ok || !data.items?.length) {
        console.error("type list fetch failed:", data?.error ?? response.statusText);
        setTypeListError("タイプ一覧の読み込みに失敗しました。");
        return;
      }

      setTypeListItems(data.items);
    } catch (error) {
      console.error("type list fetch failed:", error);
      setTypeListError("タイプ一覧の読み込みに失敗しました。");
    } finally {
      setIsLoadingTypeList(false);
    }
  };

  const openTypeList = async () => {
    setIsTypeListOpen(true);
    await fetchTypeList();
  };

  const closeTypeList = () => {
    setIsTypeListOpen(false);
  };

  const openAbout = () => {
    setIsAboutOpen(true);
  };

  const closeAbout = () => {
    setIsPrivacyOpen(false);
    setIsAboutOpen(false);
  };

  const openPrivacy = () => {
    setIsPrivacyOpen(true);
  };

  const closePrivacy = () => {
    setIsPrivacyOpen(false);
  };

  const handleAnswer = (option: QuestionOption) => {
    if (!currentQuestion) return;
    if (selectedLabel || animating || isCalculating || isLoadingQuestions || transitionLockRef.current) return;

    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);

    transitionLockRef.current = true;
    setSelectedLabel(option.label);
    setDirection("next");
    setAnimating(true);

    const advanceDelay = justWentBackRef.current ? 0 : 180;
    justWentBackRef.current = false;

    stepTimerRef.current = window.setTimeout(() => {
      setAnswers((prev) => {
        const next = [...prev];
        next[step] = option;
        return next;
      });

      setSelectedLabel(null);

      if (step < totalQuestions - 1) {
        setStep((prev) => prev + 1);
      } else {
        setStep(totalQuestions);
      }

      unlockTimerRef.current = window.setTimeout(() => {
        setAnimating(false);
        transitionLockRef.current = false;
      }, 320);
    }, advanceDelay);
  };

  const handlePrev = () => {
    if (step === 0 || selectedLabel || animating || transitionLockRef.current) return;

    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);

    transitionLockRef.current = true;
    justWentBackRef.current = true;
    setSelectedLabel(null);
    setDirection("prev");
    setAnimating(true);

    setAnswers((prev) => {
      const next = [...prev];
      for (let i = step - 1; i < next.length; i += 1) {
        next[i] = null;
      }
      return next;
    });

    setStep((prev) => prev - 1);

    unlockTimerRef.current = window.setTimeout(() => {
      setAnimating(false);
      transitionLockRef.current = false;
    }, 320);
  };

  const restartDiagnosis = async () => {
    resetDiagnosisUi();
    await prepareFreshDiagnosis();
  };

  const saveDiagnosisResult = async () => {
    if (!selectedGender || !selectedCoat || isSavingResult || !currentQuestions.length) return false;

    try {
      setIsSavingResult(true);

      const meta = getTrackingMeta();
      const payload: FinalizePayload = {
        ...meta,
        gender: selectedGender,
        coat: selectedCoat,
        current_questions: currentQuestions,
        answers,
      };

      const response = await fetch("/api/diagnosis/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafely<FinalizeResponse>(response);

      if (!response.ok || !data?.ok || !data.result) {
        console.error("result save failed:", data?.error ?? response.statusText);
        return false;
      }

      setResult(data.result);
      setSelectedAruaru(data.result.selectedAruaru ?? null);
      setCardCopy(data.result.cardCopy ?? "");


      return true;
    } catch (error) {
      console.error("result save failed:", error);
      return false;
    } finally {
      setIsSavingResult(false);
    }
  };

  const handleAppearanceNext = () => {
    if (animating || isCalculating || isSavingResult) return;

    setIsCalculating(true);
    setLoadingMessageIndex(0);

    window.setTimeout(() => {
      setLoadingMessageIndex(1);
    }, 700);

    window.setTimeout(() => {
      setLoadingMessageIndex(2);
    }, 1400);

    window.setTimeout(async () => {
      const saved = await saveDiagnosisResult();
      setIsCalculating(false);
      if (saved) {
        setShowResult(true);
      }
    }, 2200);
  };

const getShareText = () =>
  result
    ? `うちの猫のタイプは「${result.mainType}」でした🐱
${cardCopy.replace(/\n/g, " ")}
診断してみてね
${getShareUrl()}`
    : `うちの猫のタイプ診断をやってみた🐱
${getShareUrl()}`;

  const getShareUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ) => {
    const paragraphs = text.split("\n");
    const lines: string[] = [];

    paragraphs.forEach((paragraph) => {
      if (!paragraph) {
        lines.push("");
        return;
      }

      let current = "";
      for (const ch of paragraph) {
        const next = current + ch;
        if (ctx.measureText(next).width <= maxWidth || current.length === 0) {
          current = next;
        } else {
          lines.push(current);
          current = ch;
        }
      }
      if (current) lines.push(current);
    });

    return lines;
  };

  const loadImageForCanvas = async (src: string) => {
    const img = new Image();
    img.decoding = "sync";
    img.loading = "eager";
    img.src = `${src}${src.includes("?") ? "&" : "?"}v=${Date.now()}`;

    await new Promise<void>((resolve) => {
      const done = () => resolve();
      img.onload = done;
      img.onerror = done;
    });

    if ("decode" in img) {
      try {
        await img.decode();
      } catch {}
    }

    return img;
  };

  const generateShareImage = async () => {
    if (!result) return null;

    try {
      setIsPreparingShareImage(true);
      setShareImageError(null);

      if (typeof document !== "undefined" && "fonts" in document) {
        try {
          await document.fonts.ready;
          try {
            await document.fonts.load("200 88px 'Kiwami'");
          } catch {}
        } catch {}
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // title
      ctx.fillStyle = "#8a6a57";
      ctx.font = "700 48px 'Noto Sans JP', sans-serif";
      ctx.fillText("うちの子は…", width / 2, 54);

      // copy
      ctx.fillStyle = "#2b2b2b";
      ctx.font = "200 88px 'Kiwami'";
      const copyLines = wrapCanvasText(ctx, cardCopy, 880).slice(0, 3);
      let copyY = 140;
      copyLines.forEach((line) => {
        ctx.font = "200 88px 'Kiwami'";
        ctx.fillText(line, width / 2, copyY);
        copyY += 102;
      });

      // image
      const img = await loadImageForCanvas(resultImageSrc);
      const imgBox = Math.round(width * 0.72);
      const imgY = copyY + 8;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const scale = Math.min(imgBox / img.naturalWidth, imgBox / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        ctx.drawImage(img, width / 2 - drawW / 2, imgY + (imgBox - drawH) / 2, drawW, drawH);
      }

      // type name
      ctx.fillStyle = "#000000";
      ctx.font = "200 76px 'Kiwami'";
      ctx.fillText(result.mainType, width / 2, imgY + imgBox + 18);

      // type label
      ctx.fillStyle = "#4b4b4b";
      ctx.font = "700 28px 'Noto Sans JP', sans-serif";
      ctx.fillText("タイプ", width / 2, imgY + imgBox + 100);

      // copyright / brand (footer)
      ctx.fillStyle = "#9a7d69";
      ctx.font = "700 36px 'Noto Sans JP', sans-serif";
      ctx.fillText("©ねこびーてぃあい", width / 2, height - 70);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), "image/png");
      });
      if (!blob) return null;

      const file = new File([blob], "nekobti-result.png", { type: "image/png" });
      const objectUrl = URL.createObjectURL(blob);
      return { file, objectUrl };
    } catch (error) {
      console.error(error);
      setShareImageError("共有画像の生成に失敗しました");
      return null;
    } finally {
      setIsPreparingShareImage(false);
    }
  };

  const openSharePreview = async () => {
    if (!isMobileClient || isPreparingShareImage || isNativeSharing || isOpeningSharePreview || !result) return;

    setIsOpeningSharePreview(true);
    setShareImageError(null);
    setIsSharePreviewOpen(false);

    setShareImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setShareImageFile(null);

    try {
      const generated = await generateShareImage();
      if (!generated) return;

      setShareImageUrl(generated.objectUrl);
      setShareImageFile(generated.file);
      setIsSharePreviewOpen(true);
    } finally {
      setIsOpeningSharePreview(false);
    }
  };

  const closeSharePreview = () => {
    if (isPreparingShareImage || isNativeSharing || isOpeningSharePreview) return;
    setIsSharePreviewOpen(false);
  };

  const handleNativeShare = async () => {
    if (isPreparingShareImage || isNativeSharing || isOpeningSharePreview) return;

    const shareText = getShareText();
    const shareUrl = getShareUrl();
    const file = shareImageFile;

    if (!file) {
      alert("共有画像を準備中です。少し待ってからもう一度押してください。");
      return;
    }

    try {
      setIsNativeSharing(true);

      if (typeof navigator !== "undefined" && "share" in navigator) {
        const nav = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean;
          share: (data?: ShareData) => Promise<void>;
          clipboard?: { writeText: (value: string) => Promise<void> };
        };

        if (nav.canShare?.({ files: [file] })) {
          await nav.share({
            files: [file],
            text: shareText,
          });

          await trackEvent("share_clicked", {
            result_type: result?.mainType,
            mbti: result?.mbti,
            gender: selectedGender || undefined,
            coat: selectedCoat || undefined,
          });
          return;
        }

        await nav.share({
          text: shareText,
        });

        await trackEvent("share_clicked", {
          result_type: result?.mainType,
          mbti: result?.mbti,
          gender: selectedGender || undefined,
          coat: selectedCoat || undefined,
        });
        return;
      }

      const clipboard = (navigator as Navigator & {
        clipboard?: { writeText: (value: string) => Promise<void> };
      }).clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(`${shareText}
${shareUrl}`);
        await trackEvent("share_clicked", {
          result_type: result?.mainType,
          mbti: result?.mbti,
          gender: selectedGender || undefined,
          coat: selectedCoat || undefined,
        });
        alert("共有テキストをコピーしました");
        return;
      }

      alert("この端末では共有できませんでした");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error(error);
        alert("共有に失敗しました");
      }
    } finally {
      setIsNativeSharing(false);
    }
  };


  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#2b2b2b]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 md:px-10">
        <div className="mb-6 inline-flex w-fit items-center rounded-full border border-[#e8d8cb] bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm">
          ねこびーてぃあい　べーた
        </div>

        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#b07d62]">
              CAT TYPE DIAGNOSIS
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
              うちの猫のタイプ、
              <br />
              ちゃんと知ってる？
            </h1>

            <p className="mb-8 max-w-xl text-base leading-8 text-[#5f5f5f] md:text-lg">
              性格を人間に当てはめるのではなく、
              猫らしさのまま読み解く新しい診断。
              やわらかく触れたくなる体験から、
              うちの子らしさを言葉にしていく。
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={openDiagnosis}
                className="rounded-full bg-[#2b2b2b] px-6 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                診断をはじめる
              </button>

              <button
                onClick={openTypeList}
                className="rounded-full border border-[#d8c1b1] bg-white px-6 py-4 text-base font-semibold text-[#7a5c48] transition hover:bg-[#fff4ec]"
              >
                タイプ一覧を見る
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">戦略きれものねこ</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">しずか哲学ねこ</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">覇王ボスねこ</p>
              </div>
            </div>

          </div>

          <div className="relative">
            <div className="absolute -left-4 -top-4 h-32 w-32 rounded-full bg-[#ffe8d9] blur-2xl" />
            <div className="absolute -bottom-8 -right-2 h-40 w-40 rounded-full bg-[#f9d8c2] blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-[#f0dfd3] bg-white p-8 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#a3826b]">Preview</p>
                  <h2 className="text-2xl font-bold">猫タイプカード</h2>
                </div>
                <div className="rounded-full bg-[#fff3ea] px-4 py-2 text-sm font-semibold text-[#b07d62]">
                  BETA
                </div>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] p-6 ring-1 ring-[#f3e3d8]">
                <div className="mb-6 aspect-[4/5] rounded-[28px] bg-[#f8eee7] p-6">
                  <div className="flex h-full flex-col justify-between rounded-[24px] border border-dashed border-[#d9bca8] p-6 text-center">
                    <div>
                      <p className="mb-3 text-sm tracking-[0.2em] text-[#b07d62]">
                        CAT MBTI STYLE
                      </p>
                      <h3 className="text-3xl font-bold">覇王ボスねこ</h3>
                    </div>

                    <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-white text-6xl shadow-sm">
                      👑
                    </div>

                    <p className="text-sm leading-7 text-[#6c625b]">
                      堂々としていて、決断も早い。
                      空気を読むより、空間そのものを掌握するタイプ。
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-1 text-sm text-[#9a7d69]">特徴</p>
                    <p className="font-semibold">支配力 / 決断 / 王者感</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-1 text-sm text-[#9a7d69]">相性</p>
                    <p className="font-semibold">戦略きれものねこ / しきり屋リーダーねこ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-[#f0dfd3] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl justify-center">
          <button
            onClick={openAbout}
            className="text-sm font-semibold text-[#7a5c48] underline decoration-[#d8c1b1] underline-offset-4 transition hover:text-[#5f4739]"
          >
            ねこびーてぃあいについて
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/30 px-4 transition-all duration-500 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDiagnosis}
      >
        <div
          className={`mx-auto my-6 flex w-[min(92vw,680px)] max-w-[680px] max-h-[calc(100dvh-48px)] flex-col overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-500 sm:my-8 sm:p-8 ${
            isOpen ? "scale-100 blur-0" : "scale-90 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {!showResult && !isCalculating ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                    DIAGNOSIS START
                  </p>
                  <h2 className="text-3xl font-bold">
                    {
                       step === 0
                        ? "まずは "
                        : step < totalQuestions * 0.7
                        ? "次は "
                        : "あと少し "
                    }
                    {step + 1}問目
                 </h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white p-4 ring-1 ring-[#f2e5dc] sm:p-6">
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-1.5">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                      <Paw key={index} active={index < answeredCount || (isAppearanceStep && index === totalQuestions)} />
                    ))}
                  </div>

                  <p className="text-sm text-[#9a7d69]">
                    {step + 1} / {totalSteps} questions
                  </p>
                </div>

                <div
                  key={step}
                  className={`transition-all duration-300 ${
                    direction === "next"
                      ? "animate-[slideInRight_.28s_ease-out]"
                      : "animate-[slideInLeft_.28s_ease-out]"
                  }`}
                >
                  {questionLoadError ? (
                    <div className="grid gap-4 py-6">
                      <p className="text-sm leading-7 text-[#8f5f50]">{questionLoadError}</p>
                      <button
                        onClick={() => {
                          void restartDiagnosis();
                        }}
                        className="rounded-2xl border border-[#ead8ca] bg-[#fff7f2] px-4 py-3 font-bold text-[#7a5c48] transition hover:bg-[#fff0e4]"
                      >
                        もう一度読み込む
                      </button>
                    </div>
                  ) : isLoadingQuestions || !isQuestionSetReady ? (
                    <div className="py-10 text-center text-sm leading-7 text-[#9a7d69]">
                      質問を読み込んでいます...
                    </div>
                  ) : !isAppearanceStep && currentQuestion ? (
                    <>
                      <div className="mb-6 min-h-[84px]">
                        <p className="break-words text-lg font-semibold leading-7">
                          {currentQuestion.text}
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {currentQuestion.options.map((option) => {
                          const isSelected = selectedLabel === option.label;
                          const isAnsweredThisStep = answers[step] !== null;

                          return (
                            <button
                              key={option.label}
                              onClick={() => {
                                if (!isAnsweredThisStep) {
                                  handleAnswer(option);
                                }
                              }}
                              disabled={selectedLabel !== null || animating || isLoadingQuestions}
                              className={`w-full rounded-2xl border px-4 py-4 font-bold text-left break-words transition sm:px-5 ${
                                isSelected
                                  ? "scale-[0.99] border-[#c28f71] bg-[#fff0e4] shadow-sm"
                                  : "border-[#ead8ca] bg-[#fffdfb] md:hover:bg-[#fff3ea]"
                              }`}
                            >
                              <span className="block break-words leading-8">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-6 break-words text-lg font-semibold leading-9 sm:leading-8">
                        性別と毛色を選んでください
                      </p>

                      <div className="grid gap-4">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-[#7a5c48]">性別</span>
                          <select
                            value={selectedGender}
                            onChange={(e) => setSelectedGender(e.target.value as GenderOption)}
                            className="w-full rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-4 py-4 text-left text-base text-[#2b2b2b] outline-none transition focus:border-[#c28f71]"
                          >
                            <option value="">性別を選択</option>
                            <option value="male">男の子</option>
                            <option value="female">女の子</option>
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-[#7a5c48]">毛色</span>
                          <select
                            value={selectedCoat}
                            onChange={(e) => setSelectedCoat(e.target.value as CoatOption)}
                            className="w-full rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-4 py-4 text-left text-base text-[#2b2b2b] outline-none transition focus:border-[#c28f71]"
                          >
                            <option value="">毛色を選択</option>
                            <option value="tabby">キジトラ</option>
                            <option value="blackwhite">黒白</option>
                            <option value="brown">茶トラ</option>
                            <option value="black">黒</option>
                            <option value="calico">三毛</option>
                            <option value="white">白</option>
                            <option value="gray">サバトラ</option>
                          </select>
                        </label>

                        <button
                          onClick={handleAppearanceNext}
                          disabled={!selectedGender || !selectedCoat}
                          className="mt-2 w-full rounded-2xl bg-[#2b2b2b] px-4 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          結果を見る
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={step === 0 || selectedLabel !== null || animating || transitionLockRef.current || transitionLockRef.current}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none ${
                      step === 0 || selectedLabel !== null || animating
                        ? "pointer-events-none cursor-not-allowed bg-[#f3ebe5] text-[#c0a997] shadow-none"
                        : "bg-white text-[#7a5c48] shadow-sm md:hover:bg-[#fff3ea]"
                    }`}
                                      style={{ WebkitTapHighlightColor: "transparent" }}>
                    戻る
                  </button>

                  <div className="text-sm text-[#9a7d69]">ゆっくり選んでOK</div>
                </div>
              </div>
            </>
          ) : isCalculating ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                    ANALYZING
                  </p>
                  <h2 className="text-3xl font-bold">診断中...</h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div className="rounded-3xl bg-white p-5 ring-1 ring-[#f2e5dc] sm:p-6">
                <div className="flex flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] px-6 py-12 text-center ring-1 ring-[#f3e3d8]">
                  <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#eadfd6] border-t-[#b07d62]" />
                  <p className="text-lg font-semibold text-[#2b2b2b]">
                    {loadingMessages[loadingMessageIndex]}
                  </p>
                  <p className="mt-2 text-sm text-[#9a7d69]">
                    うちの子のタイプを読み解いています
                  </p>

                  <div className="mt-6 flex gap-2">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d2b8a7] [animation-delay:-0.2s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d2b8a7] [animation-delay:-0.1s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d2b8a7]" />
                  </div>
                </div>
              </div>
            </>
          ) : result ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">RESULT</p>
                  <h2 className="text-3xl font-bold">診断結果</h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div className="rounded-3xl bg-white px-3 py-3 ring-1 ring-[#f2e5dc] sm:px-4 sm:py-4">
                <div className="mb-3 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] px-3 py-3 ring-1 ring-[#f3e3d8]">
                  <p className="mb-2 text-center text-sm text-[#7a5c48]">うちの子は…</p>
                  <div className="mb-3 overflow-hidden rounded-[24px] bg-white p-2 ring-1 ring-[#f1e4da]">
                    <img
                      src={resultImageSrc}
                      alt={result.mainType}
                      onError={(e) => {
                        e.currentTarget.src = "/images/silhouette.png";
                      }}
                      className="mx-auto aspect-square w-full max-w-[320px] rounded-[18px] object-cover"
                    />
                  </div>

                  <div className="mb-3 flex min-h-[52px] items-center justify-center overflow-hidden">
                    <h3
                      className={`max-w-full text-center leading-none tracking-tight text-[#2b2b2b] whitespace-normal break-keep ${getResultTypeTitleClass(result.mainType)}`}
                      style={{ fontFamily: "'Kiwami', 'Noto Sans JP', sans-serif", fontWeight: 200 }}
                    >
                      {result.mainType}
                    </h3>
                  </div>

                  <div className="mb-2 rounded-2xl bg-white/70 px-3 py-3 pb-8 ring-1 ring-[#f1e4da]">
                    <p className="mb-2 text-sm font-bold text-[#9a7d69]">特徴</p>
                    <div className="space-y-0 text-base leading-tight text-[#4e433d] sm:text-[17px]">
                      {result.traits.map((trait) => (
                        <p key={trait} className="font-bold">・{trait}</p>
                      ))}
                    </div>
                  </div>

                  {selectedAruaru && (
                    <div className="mb-2 rounded-2xl bg-white/70 px-3 py-3 pb-8 ring-1 ring-[#f1e4da]">
                      <p className="mb-2 text-sm font-bold text-[#9a7d69]">あるある</p>
                      <p className="text-base font-bold leading-tight text-[#4e433d] sm:text-[17px]">{selectedAruaru.text}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="mt-8 mb-1 text-sm font-bold text-[#9a7d69]">飼いぬしとの相性</p>
                    <div className="space-y-2 text-[#5c5c5c]">
                      {result.compatibility.map((item) => (
                        <p key={item.type} className="text-[13px] font-medium leading-tight sm:text-sm">
                          {item.type}（{item.label}） <span className="text-[12px]">{renderHearts(item.hearts)}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <p className="mt-2 text-center text-xs text-[#9a7d69]">#ねこびーてぃあい</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={restartDiagnosis}
                    className="rounded-full bg-[#2b2b2b] px-5 py-3 text-base font-semibold text-white transition hover:opacity-90"
                  >
                    もう一度診断する
                  </button>
                  <button
                    onClick={closeDiagnosis}
                    className="rounded-full border border-[#d8c1b1] bg-white px-5 py-3 text-base font-semibold text-[#7a5c48] transition hover:bg-[#fff4ec]"
                  >
                    閉じる
                  </button>
                  <button
                    onClick={() => {
                      void openSharePreview();
                    }}
                    disabled={!isMobileClient || isOpeningSharePreview || isPreparingShareImage}
                    className={`rounded-full px-5 py-3 text-base font-semibold transition ${
                      isMobileClient
                        ? "bg-[#f1e3d6] text-[#7a5c48] hover:opacity-90"
                        : "cursor-not-allowed border border-[#e7d8cc] bg-[#f7f1ec] text-[#b59a88]"
                    }`}
                  >
                    {!isMobileClient ? "シェア（スマホ専用）" : isOpeningSharePreview ? "共有画像を準備中…" : "シェア"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {(isOpeningSharePreview || (isSharePreviewOpen && result)) && (
        <div
          className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center bg-black/45 p-4"
          onClick={(e) => {
            if (isPreparingShareImage || isNativeSharing || isOpeningSharePreview) return;
            if (e.target === e.currentTarget) closeSharePreview();
          }}
        >
          {isOpeningSharePreview ? (
            <div className="w-full max-w-[340px] rounded-[28px] bg-white px-6 py-7 text-center shadow-2xl">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#ead8ca] border-t-[#7a5c48]" />
              <p className="text-base font-bold text-[#4e433d]">共有画像を準備中…</p>
              <p className="mt-2 text-sm leading-relaxed text-[#8a6a57]">少し待ってから共有カードを表示します</p>
            </div>
          ) : (
            <div className="w-full max-w-[380px]" onClick={(e) => e.stopPropagation()}>
              <div className="relative overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-[#f1e4da]">
                <button
                  type="button"
                  onClick={closeSharePreview}
                  disabled={isPreparingShareImage || isNativeSharing}
                  aria-label="閉じる"
                  className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#8b6f5d] shadow-md ring-1 ring-black/5 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <div className="bg-[#fffdfb] p-3">
                  {shareImageUrl ? (
                    <img src={shareImageUrl} alt="共有カード" className="block w-full rounded-[24px]" />
                  ) : (
                    <div className="flex min-h-[520px] items-center justify-center rounded-[24px] bg-[#fffaf6] px-6 text-center text-sm text-[#8a6a57]">
                      共有画像を準備できませんでした
                    </div>
                  )}
                
<div className="mt-6 flex justify-center">
  <button
    onClick={() => {
      void handleNativeShare();
    }}
    disabled={isPreparingShareImage || isNativeSharing || !shareImageFile}
    className="inline-flex items-center justify-center rounded-2xl bg-[#f4e7dc] px-3 py-3 text-[#7a5c48] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <span className="flex items-center justify-center gap-2" aria-hidden="true">


      {/* X */}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black shadow-sm">
        <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
          <path
            d="M14 14h10.6L35 28.2 46.3 14H52L37.8 31.4 54 50H43.4L32.2 35.2 19.8 50H14l14.6-16.4L14 14Z"
            fill="#ffffff"
          />
        </svg>
      </span>

      {/* LINE */}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#59c65f] shadow-sm">
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white">
          <span className="text-[8px] font-black tracking-[0.02em] text-[#59c65f]">
            LINE
          </span>
          <span className="absolute bottom-[2px] left-[4px] h-2 w-2 rotate-12 bg-white [clip-path:polygon(0_0,100%_0,25%_100%)]" />
        </span>
      </span>

      {/* 共通 */}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b9b9b9] shadow-sm">
        <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
          <rect
            x="20"
            y="22"
            width="24"
            height="22"
            rx="3"
            ry="3"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
          />
          <path
            d="M26 22v-4.5c0-2.5 2-4.5 4.5-4.5h3c2.5 0 4.5 2 4.5 4.5V22"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </span>



  </span>
</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={`fixed inset-0 z-40 overflow-y-auto overflow-x-hidden bg-black/25 px-4 transition-all duration-300 ${
          isAboutOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeAbout}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,640px)] max-w-[640px] max-h-[calc(100dvh-48px)] overflow-y-auto overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-300 sm:my-8 sm:p-8 ${
            isAboutOpen ? "scale-100 blur-0" : "scale-95 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">ABOUT</p>
              <h2 className="text-xl font-bold">ねこびーてぃあいについて</h2>
            </div>

            <button
              onClick={closeAbout}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
            >
              閉じる
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#f1e4da]">
            <h3 className="mb-5 text-xl font-bold text-[#2b2b2b]">運営情報</h3>

            <div className="space-y-5 text-[15px] leading-8 text-[#4e433d] sm:text-base">
              <div>
                <p className="text-sm font-bold text-[#9a7d69]">サービス名</p>
                <p>ねこびーてぃあい（NEKOBTI）</p>
              </div>

              <div>
                <p className="text-sm font-bold text-[#9a7d69]">内容</p>
                <p>猫タイプ診断コンテンツの企画・運営</p>
              </div>

<div>
  <p className="text-sm font-bold text-[#9a7d69]">運営</p>
  <div className="mt-2 flex justify-center">
    <img
      src="/images/nekobee-logo.png"
      alt="NEKOBEE logo"
      className="h-24 w-auto object-contain"
    />
  </div>
</div>

              <div>
                <p className="text-sm font-bold text-[#9a7d69]">お問い合わせ</p>
                <a
                  href="mailto:nekobee@example.com"
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[#7a5c48] underline decoration-[#d8c1b1] underline-offset-4"
                >
                  nekobee@example.com
                </a>
              </div>

              <div>

<button
  type="button"
  onClick={openPrivacy}
  className="text-sm font-bold text-[#9a7d69] underline decoration-[#d8c1b1]"
>
  プライバシーポリシー
</button>

              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#fff7f1] px-4 py-4 text-sm leading-7 text-[#7a5c48] ring-1 ring-[#f1e4da]">
              <p>※本サービスはエンターテインメントを目的としています。</p>
              <p className="mt-2">© NEKOBEE All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-black/35 px-4 transition-all duration-300 ${
          isPrivacyOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closePrivacy}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,640px)] max-w-[640px] max-h-[calc(100dvh-48px)] overflow-y-auto overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-300 sm:my-8 sm:p-8 ${
            isPrivacyOpen ? "scale-100 blur-0" : "scale-95 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">PRIVACY POLICY</p>
              <h2 className="text-xl font-bold">プライバシーポリシー</h2>
            </div>

            <button
              onClick={closePrivacy}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
            >
              閉じる
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#f1e4da]">
            <div className="space-y-5 text-[15px] leading-6 text-[#4e433d] sm:text-base">
              <p>
                ねこびーてぃあい（以下、「本サービス」）は、診断結果の表示、サービス改善、不正利用防止、お問い合わせ対応のため、利用状況や端末情報等を取得することがあります。
              </p>

              <p>
                本サービスでは、利便性向上やアクセス解析のため、Cookie等を利用する場合があります。
              </p>

              <p>
                取得した情報は、法令に基づく場合等を除き、本人の同意なく第三者に提供しません。
              </p>

              <p>
                本サービスは、必要な範囲で外部サービスを利用することがあります。
              </p>

              <p>
                本サービスはエンターテインメントを目的として提供しており、診断結果は医学的・心理学的判断を行うものではありません。
              </p>

              <p>
                本ポリシーは、必要に応じて改定されることがあります。
              </p>

              <div>
                <p className="text-sm font-bold text-[#9a7d69]">お問い合わせ</p>
                <a
                  href="mailto:nekobee@example.com"
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[#7a5c48] underline decoration-[#d8c1b1] underline-offset-4"
                >
                  nekobee@example.com
                </a>
              </div>

            </div>

            <div className="mt-6 rounded-2xl bg-[#fff7f1] px-4 py-4 text-sm leading-7 text-[#7a5c48] ring-1 ring-[#f1e4da]">
              <p>制定日：2026年4月19日</p>
              <p className="mt-2">運営：NEKOBEE</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 overflow-y-auto overflow-x-hidden bg-black/25 px-4 transition-all duration-300 ${
          isTypeListOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeTypeList}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,760px)] max-w-[760px] max-h-[calc(100dvh-48px)] overflow-y-auto overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-300 sm:my-8 sm:p-8 ${
            isTypeListOpen ? "scale-100 blur-0" : "scale-95 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">TYPE LIST</p>
              <h2 className="text-3xl font-bold">猫タイプ一覧</h2>
            </div>

            <button
              onClick={closeTypeList}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
            >
              閉じる
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {isLoadingTypeList ? (
              <div className="rounded-3xl bg-white p-6 text-center text-[#7a5c48] shadow-sm ring-1 ring-[#f1e4da]">
                タイプ一覧を読み込み中です...
              </div>
            ) : typeListError ? (
              <div className="rounded-3xl bg-white p-6 text-center text-[#7a5c48] shadow-sm ring-1 ring-[#f1e4da]">
                {typeListError}
              </div>
            ) : (
              typeListItems.map((item) => (
                <div
                  key={item.type}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]"
                >
                  <div className="mb-3 text-5xl">{item.emoji}</div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-bold">{item.type}</h3>
                    <div className="shrink-0 rounded-full bg-[#fff3ea] px-3 py-1 text-sm font-semibold text-[#b07d62]">
                      {item.percentage !== undefined ? `${item.percentage.toFixed(1)}%` : "--.-%"}
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-[#4e433d]">
                    {item.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
