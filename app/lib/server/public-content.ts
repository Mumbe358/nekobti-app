import "server-only";

export type PublicContentKey = "about" | "privacy";

export type PublicContentField = {
  label: string;
  type?: "text" | "email" | "image" | "link";
  value?: string;
  href?: string;
  src?: string;
  alt?: string;
  action?: "open-privacy";
};

export type PublicContentData = {
  key: PublicContentKey;
  eyebrow: string;
  title: string;
  paragraphs?: string[];
  fields?: PublicContentField[];
  footerLines?: string[];
};

const publicContentMap: Record<PublicContentKey, PublicContentData> = {
  about: {
    key: "about",
    eyebrow: "ABOUT",
    title: "ねこびーてぃあいについて",
    fields: [
      {
        label: "サービス名",
        value: "ねこびーてぃあい（NEKOBTI）",
      },
      {
        label: "内容",
        value: "猫タイプ診断コンテンツの企画・運営",
      },
      {
        label: "運営",
        type: "image",
        src: "/images/nekobee-logo.png",
        alt: "NEKOBEE logo",
      },
      {
        label: "お問い合わせ",
        type: "email",
        value: "nekobee@example.com",
      },
      {
        label: "プライバシーポリシー",
        type: "link",
        value: "プライバシーポリシー",
        action: "open-privacy",
      },
    ],
    footerLines: [
      "※本サービスはエンターテインメントを目的としています。",
      "© NEKOBEE All Rights Reserved.",
    ],
  },
  privacy: {
    key: "privacy",
    eyebrow: "PRIVACY POLICY",
    title: "プライバシーポリシー",
    paragraphs: [
      "ねこびーてぃあい（以下、「本サービス」）は、診断結果の表示、サービス改善、不正利用防止、お問い合わせ対応のため、利用状況や端末情報等を取得することがあります。",
      "本サービスでは、利便性向上やアクセス解析のため、Cookie等を利用する場合があります。",
      "取得した情報は、法令に基づく場合等を除き、本人の同意なく第三者に提供しません。",
      "本サービスは、必要な範囲で外部サービスを利用することがあります。",
      "本サービスはエンターテインメントを目的として提供しており、診断結果は医学的・心理学的判断を行うものではありません。",
      "本ポリシーは、必要に応じて改定されることがあります。",
    ],
    fields: [
      {
        label: "お問い合わせ",
        type: "email",
        value: "nekobee@example.com",
      },
    ],
    footerLines: [
      "制定日：2026年4月19日",
      "運営：NEKOBEE",
    ],
  },
};

export function getPublicContent(key: PublicContentKey) {
  return publicContentMap[key] ?? null;
}
