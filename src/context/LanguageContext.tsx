import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  speechLocale: string;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Shell
    "nav.home": "Home",
    "nav.profile": "Health Profile",
    "nav.chat": "AI Health Chat",
    "nav.insights": "Health Insights",
    "nav.reports": "Medical Reports",
    "nav.settings": "Settings",
    "nav.system": "Design System",
    "nav.logout": "Log out",
    "shell.app_title": "AI Health Copilot",
    "shell.copilot": "COPILOT",

    // Dashboard
    "dash.greeting": "Good morning",
    "dash.sub": "You have been consistent with movement this week. Let's look at how your rest is doing.",
    "dash.age": "Age",
    "dash.weight": "Weight",
    "dash.sleep": "Sleep Duration",
    "dash.activity": "Physical Activity",
    "dash.years": "years",
    "dash.kg": "kg",
    "dash.sleep_unit": "avg / night",
    "dash.steps_unit": "steps / day",
    "dash.ai_insight": "AI INSIGHT",
    "dash.insight_title": "Your Health Insights",
    "dash.insight_desc": "Your sleep duration decreased by 18% compared with last week.",
    "dash.insight_body": "You averaged 6h 42m versus 8h 10m. Later bedtimes on Tuesday and Wednesday seem to account for most of the change. This is an observation, not a diagnosis.",
    "dash.view_details": "View Details",
    "dash.quick_actions": "Quick Actions",
    "dash.action_chat": "Chat with AI",
    "dash.action_chat_sub": "Ask anything about your wellbeing",
    "dash.action_reports": "View Medical Reports",
    "dash.action_reports_sub": "documents processed",
    "dash.action_profile": "Update Health Profile",
    "dash.action_profile_sub": "Keep your details current",

    // Chat
    "chat.title": "AI Health Chat",
    "chat.sub": "Ask Maya anything about your rest, activity, nutrition or medical records.",
    "chat.placeholder": "Ask Maya about your symptoms, sleep, habits...",
    "chat.listening": "Listening... Speak now",
    "chat.click_to_speak": "Click to speak (English / Hindi)",
    "chat.stop_listening": "Click to stop listening",
    "chat.speech_unsupported": "Speech recognition is not supported in this browser. Please type your message.",
    "chat.speech_denied": "Microphone permission was denied. Please allow microphone access in your browser.",
    "chat.speech_error": "Could not recognize speech. Please try speaking again.",
    "chat.send": "Send",
    "chat.clear": "Clear",
    "chat.health_context": "Health Context",
    "chat.voice_listen": "Listen",
    "chat.voice_stop": "Stop",
    "chat.copied": "Copied!",
    "chat.copy": "Copy answer",

    // Settings
    "settings.title": "Settings",
    "settings.sub": "Notifications, privacy and account preferences.",
    "settings.language_title": "Language & Speech",
    "settings.language_desc": "Choose your interface and voice recognition language.",
    "settings.english": "English (India / US)",
    "settings.hindi": "हिन्दी (Hindi)",
    "settings.daily_checkin": "Daily check-in reminder",
    "settings.daily_sub": "A gentle nudge at 8:00 am",
    "settings.weekly_digest": "Weekly insight digest",
    "settings.weekly_sub": "Sunday summary of your trends",
    "settings.report_alerts": "Report processing alerts",
    "settings.report_sub": "Notify when documents are ready",
    "settings.two_factor": "Two-factor authentication",
    "settings.two_factor_sub": "Extra security at sign in",
    "settings.share_data": "Share anonymized data for research",
    "settings.share_sub": "Off by default",
    "settings.export": "Export my data",
    "settings.delete": "Delete account",
  },
  hi: {
    // Nav & Shell
    "nav.home": "होम",
    "nav.profile": "स्वास्थ्य प्रोफ़ाइल",
    "nav.chat": "एआई स्वास्थ्य चैट",
    "nav.insights": "स्वास्थ्य इनसाइट्स",
    "nav.reports": "मेडिकल रिपोर्ट्स",
    "nav.settings": "सेटिंग्स",
    "nav.system": "डिज़ाइन सिस्टम",
    "nav.logout": "लॉग आउट",
    "shell.app_title": "एआई हेल्थ कोपायलट",
    "shell.copilot": "कोपायलट",

    // Dashboard
    "dash.greeting": "शुभ प्रभात",
    "dash.sub": "इस सप्ताह आप नियमित रूप से सक्रिय रहे हैं। आइए देखें आपकी नींद और विश्राम कैसा रहा।",
    "dash.age": "आयु",
    "dash.weight": "वज़न",
    "dash.sleep": "नींद की अवधि",
    "dash.activity": "शारीरिक गतिविधि",
    "dash.years": "वर्ष",
    "dash.kg": "किग्रा",
    "dash.sleep_unit": "औसत / रात",
    "dash.steps_unit": "कदम / दिन",
    "dash.ai_insight": "एआई इनसाइट",
    "dash.insight_title": "आपकी स्वास्थ्य अंतर्दृष्टि",
    "dash.insight_desc": "पिछले सप्ताह की तुलना में आपकी नींद की अवधि में 18% की कमी आई है।",
    "dash.insight_body": "आपने 8 घंटे 10 मिनट के मुकाबले औसतन 6 घंटे 42 मिनट नींद ली। मंगलवार और बुधवार को देर से सोने के कारण यह बदलाव हुआ। यह केवल एक अवलोकन है, चिकित्सकीय निदान नहीं।",
    "dash.view_details": "विवरण देखें",
    "dash.quick_actions": "त्वरित कार्य",
    "dash.action_chat": "एआई से चैट करें",
    "dash.action_chat_sub": "अपने स्वास्थ्य के बारे में कुछ भी पूछें",
    "dash.action_reports": "मेडिकल रिपोर्ट्स देखें",
    "dash.action_reports_sub": "दस्तावेज़ विश्लेषित",
    "dash.action_profile": "प्रोफ़ाइल अपडेट करें",
    "dash.action_profile_sub": "अपनी जानकारी को ताज़ा रखें",

    // Chat
    "chat.title": "एआई स्वास्थ्य चैट",
    "chat.sub": "माया से अपनी नींद, गतिविधि, खान-पान या मेडिकल रिपोर्ट्स के बारे में पूछें।",
    "chat.placeholder": "माया से अपने स्वास्थ्य, नींद या आदतों के बारे में पूछें...",
    "chat.listening": "सुन रहे हैं... अब बोलें",
    "chat.click_to_speak": "बोलकर पूछने के लिए क्लिक करें (हिन्दी / English)",
    "chat.stop_listening": "रिकॉर्डिंग रोकने के लिए क्लिक करें",
    "chat.speech_unsupported": "इस ब्राउज़र में स्पीच रिकग्निशन उपलब्ध नहीं है। कृपया टाइप करें।",
    "chat.speech_denied": "माइक्रोफ़ोन की अनुमति अस्वीकृत की गई। कृपया ब्राउज़र में अनुमति दें।",
    "chat.speech_error": "आवाज़ पहचानी नहीं जा सकी। कृपया पुनः बोलें।",
    "chat.send": "भेजें",
    "chat.clear": "साफ़ करें",
    "chat.health_context": "स्वास्थ्य संदर्भ",
    "chat.voice_listen": "सुने",
    "chat.voice_stop": "रोकें",
    "chat.copied": "कॉपी हो गया!",
    "chat.copy": "उत्तर कॉपी करें",

    // Settings
    "settings.title": "सेटिंग्स",
    "settings.sub": "सूचनाएं, गोपनीयता और खाता प्राथमिकताएं।",
    "settings.language_title": "भाषा और आवाज़",
    "settings.language_desc": "इंटरफ़ेस और वॉइस रिकग्निशन की भाषा चुनें।",
    "settings.english": "English (अंग्रेज़ी)",
    "settings.hindi": "हिन्दी (Hindi)",
    "settings.daily_checkin": "दैनिक चेक-इन अनुस्मारक",
    "settings.daily_sub": "सुबह 8:00 बजे एक सौम्य संकेत",
    "settings.weekly_digest": "साप्ताहिक इनसाइट डाइजेस्ट",
    "settings.weekly_sub": "रविवार को आपके स्वास्थ्य रुझानों का सारांश",
    "settings.report_alerts": "रिपोर्ट प्रोसेसिंग अलर्ट",
    "settings.report_sub": "दस्तावेज़ तैयार होने पर सूचित करें",
    "settings.two_factor": "दो-चरणीय प्रमाणीकरण (2FA)",
    "settings.two_factor_sub": "साइन इन करते समय अतिरिक्त सुरक्षा",
    "settings.share_data": "शोध के लिए अनामीकृत डेटा साझा करें",
    "settings.share_sub": "डिफ़ॉल्ट रूप से बंद",
    "settings.export": "मेरा डेटा निर्यात करें",
    "settings.delete": "खाता हटाएं",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  speechLocale: "en-IN",
  t: (k: string) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("copilot_lang");
    return saved === "hi" ? "hi" : "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("copilot_lang", newLang);
    } catch {
      // Ignore
    }
  };

  const speechLocale = lang === "hi" ? "hi-IN" : "en-IN";

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, speechLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
