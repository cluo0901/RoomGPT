export const copy = {
  header: {
    brand: "RoomGPT",
    nav: {
      howItWorks: "How it works",
      styles: "Styles",
      pricing: "Pricing",
      dashboard: "Dashboard",
      admin: "Admin",
      signIn: "Sign in",
      signOut: "Sign out",
    },
  },
  footer: {
    copyrightSuffix: "RoomGPT.",
    supportEmail: "support@roomgpt.io",
  },
  home: {
    hero: {
      badge: "One-Click Interior Studio",
      title: "Redesign your room in seconds",
      description:
        "RoomGPT transforms your photos into polished design concepts that feel tailored to your taste. Swap styles, iterate quickly, and share interactive before-and-after sliders without scheduling a single site visit.",
      cta: "Redesign your room",
      comparisonCaption: "Drag, compare, and export HD concepts in one click.",
    },
    features: {
      title: "Everything you need to pitch the perfect room",
      subtitle:
        "RoomGPT pairs powerful generative models with designer-approved templates so you can deliver concepts faster than ever before.",
      cards: [
        {
          title: "Photorealistic redesigns",
          description:
            "RoomGPT keeps your layout while refreshing colors, furniture, lighting, and styling with magazine-worthy detail.",
        },
        {
          title: "Dozens of styles",
          description:
            "Browse modern, Scandinavian, Japandi, luxury, coastal, and more. Save presets or mix and match instantly.",
        },
        {
          title: "Share with clients",
          description:
            "Send interactive before-and-after sliders, download HD renders, or export prompts to reuse in other tools.",
        },
      ],
    },
    steps: {
      title: "A polished concept in three steps",
      description:
        "Every render is grounded in your original layout, so proportions stay true to life. Iterate on furniture, color palettes, finishes, or lighting in a few clicks.",
      items: [
        {
          title: "Upload your room",
          description:
            "Snap a quick photo of any room. No special lighting or staging required.",
        },
        {
          title: "Choose a style",
          description:
            "Select from curated interiors or build your own palette, materials, and vibe.",
        },
        {
          title: "Generate & iterate",
          description:
            "Create multiple concepts, compare results side by side, and download the winners.",
        },
      ],
      overlayText:
        "Upload a photo, choose a vibe, and compare results with interactive sliders.",
    },
    styles: {
      title: "Signature looks, ready to explore",
      subtitle:
        "Mix curated styles with your own palette. Save presets for future projects or clients.",
      cards: [
        { label: "Modern Luxe", image: "/generated-pic-2.jpg" },
        { label: "Japandi Haven", image: "/generated-pic.png" },
        { label: "Scandinavian Calm", image: "/generatedpic.png" },
        { label: "Coastal Breeze", image: "/original-pic.jpg" },
        { label: "Art Deco Glow", image: "/generated-pic-2.jpg" },
        { label: "Mid-century Mood", image: "/generated-pic.png" },
        { label: "Industrial Loft", image: "/generatedpic.png" },
        { label: "Desert Modern", image: "/generated-pic-2.jpg" },
        { label: "Minimal Zen", image: "/generated-pic.png" },
      ],
    },
    pricing: {
      title: "Pricing that flexes with your workload",
      subtitle:
        "Start with one-off generations or unlock unlimited access for your studio. Billing is powered by Stripe so you can upgrade anytime.",
      plans: [
        {
          title: "Pay per use",
          description: "Perfect for quick refreshes and one-off projects.",
          price: "$3",
          cadence: "per generation",
          cta: "Purchase generation",
          variant: "outline",
        },
        {
          title: "Bundle + save",
          description:
            "Buy credits in bulk and generate whenever inspiration strikes.",
          bullets: ["• 10 renders — $25", "• 25 renders — $55"],
          footnote: "Credits never expire.",
          cta: "Buy bundle",
          variant: "primary",
        },
        {
          title: "Unlimited studio",
          description:
            "Unlimited renders for interior teams and real estate pros.",
          price: "$99",
          cadence: "per month",
          footnote:
            "Includes priority generations, HD downloads, and team billing.",
          cta: "Subscribe now",
          variant: "accent",
        },
      ],
    },
    testimonials: {
      title: "What customers say",
      subtitle:
        "Loved by interior designers, realtors, stagers, and creative teams worldwide.",
      cards: [
        {
          quote:
            "RoomGPT helps our design team ship client-ready concepts in minutes. It’s our favorite ideation tool.",
          name: "Avery Chen",
          role: "Principal Designer, Studio Juniper",
          image: "/generated-pic-2.jpg",
        },
        {
          quote:
            "I sold three staging packages this month using RoomGPT mockups. The renders speak for themselves.",
          name: "Miguel Ortega",
          role: "Realtor & Stager",
          image: "/generatedpic.png",
        },
        {
          quote:
            "Our clients love seeing options instantly. The speed and quality means we can iterate without booking extra meetings.",
          name: "Priya Desai",
          role: "Founder, Nest & Nook Studio",
          image: "/generated-pic.png",
        },
        {
          quote:
            "RoomGPT unlocked a new revenue stream for our staging business. We close deals faster with polished visuals.",
          name: "Jordan Smith",
          role: "Owner, Styled Spaces",
          image: "/original-pic.jpg",
        },
        {
          quote:
            "From concept boards to final proposals, RoomGPT keeps our pipeline moving. It’s become the core of our presentation workflow.",
          name: "Lina Torres",
          role: "Lead Designer, Horizon Homes",
          image: "/generated-pic-2.jpg",
        },
        {
          quote:
            "RoomGPT lets us experiment with ambitious styles before committing budget. It changed how we collaborate with clients.",
          name: "Connor Blake",
          role: "Creative Director, Atelier 12",
          image: "/generatedpic.png",
        },
      ],
    },
    cta: {
      title: "Ready to showcase the future of your space?",
      description:
        "Generate unlimited concepts with RoomGPT and deliver proposals that win clients faster.",
      button: "Start creating",
    },
  },
  dream: {
    badge: "Interactive editor",
    title: "Generate polished redesigns from any room photo",
    description:
      "Upload a space, choose a vibe, and deliver magazine-worthy renderings in minutes. RoomGPT preserves your layout while refreshing finishes, lighting, and decor.",
    benefits: [
      {
        title: "Upload any room photo",
        description:
          "No staging required—RoomGPT keeps proportions grounded in your source image.",
      },
      {
        title: "Explore curated styles",
        description:
          "Mix presets with custom prompts and iterate until you nail the concept.",
      },
      {
        title: "Share, compare, and download",
        description:
          "Use interactive sliders, export HD renders, and keep the prompt breakdown for reuse.",
      },
    ],
    billingReminderPrefix: "Manage billing and credits from your ",
    billingReminderLink: "dashboard",
    billingReminderSuffix: ". Unlimited plans unlock faster generations.",
    generateButton: "Generate new design",
    missingPhotoError: "Upload a photo to generate a new design.",
    resultsPlaceholder: "Upload a photo and generate to view results here.",
    authBanner:
      "Sign in to generate rooms and save your progress. Credits and subscriptions live in your dashboard.",
    styleStep: "Choose your style",
    roomStep: "Select your room type",
    uploadStep: "Upload your reference photo",
    remodelledHeading: (room: string, theme: string) =>
      `Here's your remodeled ${room.toLowerCase()} in the ${theme.toLowerCase()} theme.`,
    toggleLabel: "Toggle views or download the HD render below.",
    originalLabel: "Original",
    generatedLabel: "Generated",
    loading: "Preparing your render…",
    newRoom: "Generate new room",
    download: "Download render",
    promptTitle: "Prompt breakdown",
    promptGeneral: "General",
    promptRoom: "Room",
    promptTheme: "Style",
    sampling: "Sampling",
    controlnet: "ControlNet",
    errorFallback: "Image generation failed",
  },
  dashboard: {
    badge: "Account",
    heading: "Manage your RoomGPT access",
    subheading:
      (user: string) =>
        `Signed in as ${user}. Top up credits, switch plans, and review recent generations.`,
    supabaseError:
      "Supabase credentials are not configured. Billing data will not be displayed.",
    planLabel: "Plan",
    planStatusLabel: "Status:",
    creditsLabel: "Credits",
    creditsDescription: "Bundles and pay-per-use deduct one credit per generation.",
    quickActions: "Quick actions",
    generate: "Generate a room",
    backHome: "Back to home",
    topUpTitle: "Top up your account",
    unlimitedBadge: "Unlimited subscription active",
    recentUsageTitle: "Recent usage",
    recentUsageHint: "Last 5 generations",
    recentUsageEmpty: "Generate your first room to see usage history here.",
    tableHeaders: {
      when: "When",
      provider: "Provider",
      approach: "Approach",
      credits: "Credits",
    },
    planNames: {
      subscription: "Unlimited subscription",
      bundle: "Credit bundle",
      pay_per_use: "Pay per use",
      default: "No active plan",
    },
    subscriptionStatusUnknown: "unknown",
    purchaseButtons: {
      options: [
        {
          key: "pay_per_use",
          title: "Single generation",
          blurb: "Perfect for one-off redesigns. Pay only when you generate.",
          hint: "Charged per request",
          variant: "outline",
        },
        {
          key: "bundle_10",
          title: "10-credit bundle",
          blurb: "Buy 10 generations upfront at a discounted rate.",
          hint: "One-time bundle",
          variant: "primary",
        },
        {
          key: "bundle_25",
          title: "25-credit bundle",
          blurb: "Bulk credits for power users and teams.",
          hint: "Best value bundle",
          variant: "outline",
        },
        {
          key: "subscription_unlimited",
          title: "Unlimited monthly",
          blurb: "Unlimited generations with fair-use protections. Billed monthly.",
          hint: "Recurring subscription",
          variant: "accent",
        },
      ],
      buttonIdle: "Checkout",
      buttonLoading: "Redirecting…",
      error: "Unable to start checkout. Try again.",
      networkError: "Network error. Please try again.",
    },
  },
  auth: {
    signInPage: {
      badge: "Welcome back",
      title: "Sign in to continue exploring RoomGPT",
      subtitle:
        "Access your saved generations, manage credits, and remix your rooms from any device.",
      chooseMethod: "Choose how you’d like to sign in",
      google: "Continue with Google",
      github: "Continue with GitHub",
      magicLink: "Send magic link",
      emailTitleSignIn: "Sign in with email",
      emailTitleSignUp: "Create an account",
      toggleToSignUp: "Need an account? Sign up",
      toggleToSignIn: "Have an account? Sign in",
      nameLabel: "Name (optional)",
      emailLabel: "Email",
      passwordLabel: "Password",
      submitSignIn: "Sign in with email",
      submitSignUp: "Create account",
      processing: "Processing...",
      success: "Account created. Signing you in...",
      errorRequired: "Email and password are required.",
      errorUnexpected: "Unexpected error. Please try again.",
      errorInvalid: "Invalid email or password.",
      errors: {
        OAuthAccountNotLinked:
          "That email is already linked to another login method. Try signing in with the provider you used previously or create a password for email login.",
        CredentialsSignin: "Invalid email or password. Please try again.",
        Callback:
          "We couldn't complete the login flow. Try again or use a different method.",
        default: "Sign-in failed. Please try again.",
      },
    },
  },
  admin: {
    badge: "Admin",
    title: "RoomGPT control center",
    subtitle:
      "Manage credits, plans, and recent usage for any customer. Access is limited to emails listed in ADMIN_EMAILS.",
    lookup: {
      heading: "Find a user",
      description:
        "Look up a user by the email they use to sign in. You can then add credits or toggle their subscription status.",
      placeholder: "user@example.com",
      button: "Lookup",
      emptyEmail: "Enter an email address to look up.",
      errorLookup: "Failed to load user.",
      errorNetwork: "Network error while loading user.",
    },
    alerts: {
      error: "Action failed.",
      success: "Action completed.",
      actionNetwork: "Network error while performing action.",
      creditInput: "Enter a non-zero numeric amount to add or subtract credits.",
    },
    userDetails: {
      heading: "User details",
      email: "Email",
      name: "Name",
      plan: "Plan",
      subscriptionStatus: "Subscription status",
      remainingCredits: "Remaining credits",
      noPlan: "No plan",
      none: "—",
    },
    planLabels: {
      subscription: "Unlimited subscription",
      bundle: "Credit bundle",
      pay_per_use: "Pay per use",
      trial: "Trial",
    },
    credits: {
      heading: "Adjust credits",
      description:
        "Positive values add credits; negative values remove them.",
      placeholder: "e.g. 5 or -3",
      button: "Apply change",
      buttonPending: "Updating…",
    },
    planControls: {
      heading: "Plan controls",
      description:
        "Switch the user's plan or toggle the unlimited subscription.",
      subscription: "Activate unlimited subscription",
      bundle: "Mark as credit bundle user",
      payPerUse: "Mark as pay-per-use user",
      trial: "Move to trial / no plan",
    },
    usage: {
      heading: "Recent usage",
      empty: "No usage events recorded for this user.",
      when: "When",
      provider: "Provider",
      approach: "Approach",
      credits: "Credits",
    },
  },
};

export type Copy = typeof copy;
