"use client";

import * as React from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { apiFetch, apiUpload } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/client";
import { usePagePermission } from "@/lib/auth/usePermissions";
import {
  Microscope,
  Upload,
  FileText,
  AlertTriangle,
  Download,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

type PatientDoc = {
  id: string;
  name: string;
  category: string;
  file_path: string;
  created_at: string;
};

type PatientWithDocs = {
  id: string;
  first_name: string;
  last_name: string;
  severity_status: string;
  pathology: string;
  documents: PatientDoc[];
};

type Report = {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  document_ids: string[];
  report_content: {
    summary: string;
    findings: string[];
    observations: string;
    alerts: string[];
  };
  created_at: string;
  created_by: number | null;
};

export default function AnalysePage() {
  const { t } = useI18n();
  const hasAccess = usePagePermission("can_view_documents");

  const [patients, setPatients] = React.useState<PatientWithDocs[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [showReports, setShowReports] = React.useState(false);
  const [expandedReportId, setExpandedReportId] = React.useState<string | null>(null);
  const [analyzingPatient, setAnalyzingPatient] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadReport, setUploadReport] = React.useState<Report | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [patientsData, reportsData] = await Promise.all([
        apiFetch<PatientWithDocs[]>("/api/analyse/patients"),
        apiFetch<Report[]>("/api/analyse/reports")
      ]);
      setPatients(patientsData);
      setReports(reportsData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  async function handleAnalyze(patientId: string, docIds: string[]) {
    setAnalyzingPatient(patientId);
    toast.loading(t("analysisInProgress"));
    try {
      const result = await apiFetch<{ id: string; report: any }>("/api/analyse/analyze-existing", {
        method: "POST",
        body: JSON.stringify({ patientId, documentIds: docIds })
      });
      const newReport: Report = {
        id: result.id,
        patient_id: patientId,
        first_name: patients.find(p => p.id === patientId)?.first_name || "",
        last_name: patients.find(p => p.id === patientId)?.last_name || "",
        document_ids: docIds,
        report_content: result.report,
        created_at: new Date().toISOString(),
        created_by: null
      };
      toast.dismiss();
      toast.success(t("analysisSuccess"));
      setSelectedReport(newReport);
      setExpandedReportId(null);
      setReports(prev => [newReport, ...prev]);
    } catch (err) {
      toast.dismiss();
      toast.error(t("analysisError"));
      console.error(err);
    }
    setAnalyzingPatient(null);
  }

  async function handleUploadAnalyze(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const patientSelect = form.elements.namedItem("patientId") as HTMLSelectElement;
    if (!fileInput?.files?.length || !patientSelect?.value) return;

    setUploading(true);
    setUploadReport(null);
    toast.loading(t("analysisInProgress"));
    try {
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);
      formData.append("patientId", patientSelect.value);
      formData.append("documentIds", "[]");

      const result = await apiUpload<{ id: string; report: any }>("/api/analyse/analyze", formData);
      toast.dismiss();
      toast.success(t("analysisSuccess"));
      setUploadReport({
        id: result.id,
        patient_id: patientSelect.value,
        first_name: "",
        last_name: "",
        document_ids: [],
        report_content: result.report,
        created_at: new Date().toISOString(),
        created_by: null
      });
      setSelectedReport(null);
      setExpandedReportId(null);
      loadData().catch(() => undefined);
    } catch (err) {
      toast.dismiss();
      toast.error(t("analysisError"));
      console.error(err);
    }
    setUploading(false);
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p>Accès refusé</p>
      </div>
    );
  }

  const severityColor = (s: string) => {
    switch (s) {
      case "critique": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "surveillance": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  function downloadPdf(report: Report) {
    const content = report.report_content;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text("Rapport d'Analyse", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Patient: ${report.first_name} ${report.last_name}`, 20, y);
    doc.text(`Date: ${new Date(report.created_at).toLocaleDateString("fr-FR")}`, pageWidth - 20, y, { align: "right" });
    y += 12;

    doc.setDrawColor(37, 99, 235);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Résumé", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(content.summary, pageWidth - 40);
    doc.text(summaryLines, 20, y);
    y += summaryLines.length * 5 + 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Observations", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (content.findings && content.findings.length > 0) {
      for (const f of content.findings) {
        const lines = doc.splitTextToSize(`- ${f}`, pageWidth - 40);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 2;
      }
    }
    y += 4;

    if (content.observations) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Note", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const obsLines = doc.splitTextToSize(content.observations, pageWidth - 40);
      doc.text(obsLines, 20, y);
      y += obsLines.length * 5 + 6;
    }

    if (content.alerts && content.alerts.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Alertes", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const a of content.alerts) {
        const lines = doc.splitTextToSize(`- ${a}`, pageWidth - 40);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 2;
      }
    }

    doc.save(`rapport-${report.id}.pdf`);
  }

  const activeReport = selectedReport || uploadReport;

  return (
    <div className="space-y-6">
      <Dialog open={!!activeReport} onOpenChange={(open) => { if (!open) { setSelectedReport(null); setUploadReport(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-blue-600" />
              {t("analyseReport")}
            </DialogTitle>
          </DialogHeader>
          {activeReport && (() => {
            const content = activeReport.report_content;
            return (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">{t("reportSummary")}</h4>
                  <p className="text-sm text-muted-foreground">{content.summary}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-1">{t("reportFindings")}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {content.findings?.map((f: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">{f}</li>
                    ))}
                  </ul>
                </div>

                {content.observations && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{t("note")}</h4>
                    <p className="text-sm text-muted-foreground">{content.observations}</p>
                  </div>
                )}

                {content.alerts && content.alerts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-red-600">{t("reportAlerts")}</h4>
                    <ul className="space-y-1">
                      {content.alerts.map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => downloadPdf(activeReport)}>
                    <Download className="h-4 w-4 mr-1" />
                    {t("downloadReport")}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-blue-600" />
            {t("analyseUpload")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("analyseUploadDesc")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUploadAnalyze} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("patients")}</label>
              <select
                name="patientId"
                required
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">{t("select")}</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("documents")}</label>
              <input
                type="file"
                name="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-sm file:font-medium file:text-blue-700 dark:file:bg-blue-950/30 dark:file:text-blue-400"
              />
            </div>
            <Button type="submit" disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Microscope className="h-4 w-4" />}
              {t("analyseButton")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("analyseModule")}</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowReports(!showReports)} className="gap-1 self-start">
          <Clock className="h-4 w-4" />
          {t("analysisHistory")} ({reports.length})
          {showReports ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {showReports && reports.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {reports.map(r => {
                const isExpanded = expandedReportId === r.id;
                return (
                  <div key={r.id} className="rounded-lg border">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedReportId(isExpanded ? null : r.id);
                        setSelectedReport(null);
                      }}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Microscope className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{r.first_name} {r.last_name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t px-2 sm:px-3 py-3 space-y-3 bg-muted/20">
                        <div>
                          <h4 className="font-semibold text-xs mb-0.5">{t("reportSummary")}</h4>
                          <p className="text-sm text-muted-foreground">{r.report_content.summary}</p>
                        </div>

                        {r.report_content.findings && r.report_content.findings.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-xs mb-0.5">{t("reportFindings")}</h4>
                            <ul className="list-disc list-inside space-y-0.5">
                              {r.report_content.findings.map((f: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground">{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {r.report_content.observations && (
                          <div>
                            <h4 className="font-semibold text-xs mb-0.5">{t("note")}</h4>
                            <p className="text-sm text-muted-foreground">{r.report_content.observations}</p>
                          </div>
                        )}

                        {r.report_content.alerts && r.report_content.alerts.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-xs mb-0.5 text-red-600">{t("reportAlerts")}</h4>
                            <ul className="space-y-0.5">
                              {r.report_content.alerts.map((a: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 text-sm text-red-600">
                                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                          <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" onClick={() => downloadPdf(r)}>
                            <Download className="h-3 w-3 mr-1" />
                            {t("downloadReport")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t("noData")}</div>
        ) : (
          patients.map(patient => {
            const hasDocs = patient.documents && patient.documents.length > 0;
            return (
              <Card key={patient.id} className={hasDocs ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">
                        {patient.first_name} {patient.last_name}
                      </CardTitle>
                      <Badge className={severityColor(patient.severity_status)}>
                        {patient.severity_status}
                      </Badge>
                      {patient.pathology && (
                        <span className="text-xs text-muted-foreground">{patient.pathology}</span>
                      )}
                    </div>
                    {hasDocs && (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(
                          patient.id,
                          patient.documents.map(d => d.id)
                        )}
                        disabled={analyzingPatient === patient.id}
                        className="gap-1"
                      >
                        {analyzingPatient === patient.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Microscope className="h-4 w-4" />
                        )}
                        {t("analyseButton")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!hasDocs ? (
                    <p className="text-sm text-muted-foreground">{t("noDocuments")}</p>
                  ) : (
                    <div className="space-y-2">
                      {patient.documents.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border p-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.category} &middot; {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
