export type Locale = "fr" | "en" | "ar";

export const locales: Locale[] = ["fr", "en", "ar"];

export const messages = {
  fr: {
    appName: "CardioManager",
    loginTitle: "Connexion",
    loginSubtitle: "Choisissez votre profil",
    staffTab: "Personnel médical",
    patientTab: "Espace patient",
    login: "Identifiant",
    password: "Mot de passe",
    signIn: "Se connecter",
    dashboard: "Tableau de bord",
    patients: "Patients"
  },
  en: {
    appName: "CardioManager",
    loginTitle: "Sign in",
    loginSubtitle: "Choose your profile",
    staffTab: "Staff",
    patientTab: "Patient portal",
    login: "Login",
    password: "Password",
    signIn: "Sign in",
    dashboard: "Dashboard",
    patients: "Patients"
  },
  ar: {
    appName: "CardioManager",
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "اختر ملفك الشخصي",
    staffTab: "طاقم العيادة",
    patientTab: "بوابة المريض",
    login: "المعرف",
    password: "كلمة المرور",
    signIn: "دخول",
    dashboard: "لوحة التحكم",
    patients: "المرضى"
  }
} as const;

export function getDir(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
