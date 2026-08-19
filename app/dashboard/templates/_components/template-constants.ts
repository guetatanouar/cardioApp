import {
  FileText,
  ClipboardList,
  Award,
} from "lucide-react";

export type TemplateCategoryMeta = {
  label: string;
  icon: React.ElementType;
  color: string;
};

export const CATEGORY_META: Record<string, TemplateCategoryMeta> = {
  ordonnance: { label: "Ordonnance", icon: FileText, color: "text-blue-600" },
  compte_rendu: {
    label: "Compte rendu",
    icon: ClipboardList,
    color: "text-emerald-600",
  },
  certificat: { label: "Certificat", icon: Award, color: "text-violet-600" },
};

export const CATEGORY_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "ordonnance", label: "Ordonnance" },
  { value: "compte_rendu", label: "Compte rendu" },
  { value: "certificat", label: "Certificat" },
];

export const DEFAULT_TEMPLATES: Record<
  string,
  { name: string; description: string; category: string; content: any }
> = {
  ordonnance: {
    name: "Ordonnance m\u00e9dicale",
    description: "Template standard pour les ordonnances m\u00e9dicales",
    category: "ordonnance",
    content: {
      title: "ORDONNANCE M\u00c9DICALE",
      sections: [
        {
          label: "Informations patient",
          fields: ["patient_name", "date_of_birth"],
        },
        { label: "Prescription", fields: ["medications"] },
        { label: "Notes", fields: ["notes"] },
      ],
      fields: {
        patient_name: "",
        date_of_birth: "",
        medications: [],
        notes: "",
      },
    },
  },
  compte_rendu: {
    name: "Compte rendu m\u00e9dical",
    description: "Template pour les comptes rendus de consultation",
    category: "compte_rendu",
    content: {
      title: "COMPTE RENDU M\u00c9DICAL",
      sections: [
        {
          label: "Informations patient",
          fields: ["patient_name", "date_of_birth", "gender"],
        },
        {
          label: "Consultation",
          fields: ["consultation_date", "motif", "examination"],
        },
        {
          label: "Diagnostic et traitement",
          fields: ["diagnosis", "treatment"],
        },
        { label: "Observations", fields: ["notes"] },
      ],
      fields: {
        patient_name: "",
        date_of_birth: "",
        gender: "",
        consultation_date: "",
        motif: "",
        examination: "",
        diagnosis: "",
        treatment: "",
        notes: "",
      },
    },
  },
  certificat: {
    name: "Certificat m\u00e9dical",
    description: "Template pour les certificats m\u00e9dicaux",
    category: "certificat",
    content: {
      title: "CERTIFICAT M\u00c9DICAL",
      sections: [
        {
          label: "Informations patient",
          fields: ["patient_name", "date_of_birth"],
        },
        {
          label: "Motif du certificat",
          fields: ["motif", "duration", "rest_period"],
        },
        { label: "Observations", fields: ["observations"] },
      ],
      fields: {
        patient_name: "",
        date_of_birth: "",
        motif: "",
        duration: "",
        rest_period: "",
        observations: "",
      },
    },
  },
};
