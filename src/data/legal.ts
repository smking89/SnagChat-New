export type LegalSection = { heading: string; body: string };

export type LegalDoc = {
  id: string;
  /** Short label for footer links. */
  short: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "terms",
    short: "Terms",
    title: "Terms of Service",
    updated: "27 October 2026",
    intro:
      "These terms cover your use of SnagChat. This build is a preview: it runs entirely in your browser and is not a commercial service yet.",
    sections: [
      {
        heading: "Using SnagChat",
        body: "You need to be at least 13 to create an account. Keep your login details to yourself, and do not use the app to harass other players, post content you do not have the rights to, or attempt to break the app.",
      },
      {
        heading: "Your content",
        body: "You keep ownership of the clips, base builds and posts you upload. By posting, you allow SnagChat to show that content to the people your visibility settings allow — your followers, your squad, or the public feed.",
      },
      {
        heading: "Moderation",
        body: "Squad owners manage their own galleries and can remove posts or members. We may remove content or accounts that break these terms, and you can report a post or player from their profile.",
      },
      {
        heading: "Preview limits",
        body: "Accounts, posts, messages and settings on this build are stored in your browser only. Clearing site data, or deleting your account from Settings, removes them permanently. There is no backup.",
      },
      {
        heading: "Changes",
        body: "These terms may change as the app grows. Continuing to use SnagChat after a change means you accept the updated terms.",
      },
    ],
  },
  {
    id: "privacy",
    short: "Privacy",
    title: "Privacy Policy",
    updated: "27 October 2026",
    intro:
      "This policy explains what SnagChat stores, where it goes, and how to get rid of it. In this preview, everything stays on your device.",
    sections: [
      {
        heading: "What we store",
        body: "Your display name, username, email, hashed password, birthday, region, platform, interests, optional gender and phone number, plus whatever you post: snags, comments, likes, follows, squads, invites and messages.",
      },
      {
        heading: "Where it lives",
        body: "In this build, all of it lives in your browser's local storage on this device. Nothing is uploaded to a server, so nobody else — including us — can read it.",
      },
      {
        heading: "What is private",
        body: "Your birthday, gender and phone number appear only in your own account settings. They never appear on your public profile. Your posts are visible to whoever your visibility settings allow.",
      },
      {
        heading: "Your control",
        body: "Settings → Download my data exports everything tied to your account as JSON, without your password hash or salt. Settings → Delete account removes the account and clears the app's stored data from this browser.",
      },
      {
        heading: "Contact",
        body: "Questions about privacy can go to the SnagChat team through the project repository. This preview has no support inbox yet.",
      },
    ],
  },
  {
    id: "cookies",
    short: "Cookies",
    title: "Cookie Policy",
    updated: "27 October 2026",
    intro: "SnagChat does not use advertising or analytics cookies. It uses browser storage to keep you signed in.",
    sections: [
      {
        heading: "No tracking cookies",
        body: "There are no third-party scripts, pixels or advertising cookies on this build. Nothing follows you off the app.",
      },
      {
        heading: "Local storage",
        body: "The app keeps your session, profile, posts, squads and messages in your browser's local storage under the snagchat: prefix. This is what makes the app feel persistent between reloads.",
      },
      {
        heading: "Clearing it",
        body: "Clearing site data in your browser, or using Settings → Delete account, removes all of it. You will be signed out and the app starts fresh.",
      },
    ],
  },
  {
    id: "guidelines",
    short: "Guidelines",
    title: "Community Guidelines",
    updated: "27 October 2026",
    intro: "SnagChat is built for the people you queue with. These are the house rules that keep it worth opening.",
    sections: [
      {
        heading: "Play nice",
        body: "No harassment, slurs, threats or targeted pile-ons. Disagree about a loadout, not a person.",
      },
      {
        heading: "Post what is yours",
        body: "Share your own clips and base builds. If you post someone else's work, credit them and make sure they are happy with it.",
      },
      {
        heading: "Keep squads honest",
        body: "Squad owners control the gallery. Invite people who want to be there, and remove members rather than letting a disagreement spill into the feed.",
      },
      {
        heading: "Respect privacy",
        body: "Do not repost someone's private posts, screenshots of their messages, or their personal details. Private accounts are private for a reason.",
      },
      {
        heading: "Report it",
        body: "If something breaks these rules, report the post or the player. Squad owners can remove posts from their own gallery straight away.",
      },
    ],
  },
];

export function findLegalDoc(id: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((doc) => doc.id === id);
}

export const COPYRIGHT_YEAR = new Date().getFullYear();
