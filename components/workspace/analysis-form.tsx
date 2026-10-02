"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileUp, LoaderCircle, Sparkles } from "lucide-react";
import { hasPdfHeader } from "@/lib/resume/pdf-validation";
import { maxResumeSize } from "@/lib/resume/upload-config";

type ResumeChoice = { id: string; fileName: string; createdAt: string };

async function responseError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error ?? "Something went wrong. Please try again.";
}

export function AnalysisForm({ resumes: initialResumes }: { resumes: ResumeChoice[] }) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [resumeId, setResumeId] = useState(initialResumes[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  async function uploadResume(selectedFile: File) {
    if (!selectedFile.size) throw new Error("Choose a non-empty PDF file.");
    if (selectedFile.size > maxResumeSize) throw new Error("Choose a PDF smaller than 15 MB.");
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) throw new Error("Choose a file with the .pdf extension.");
    const header = new Uint8Array(await selectedFile.slice(0, 1024).arrayBuffer());
    if (!hasPdfHeader(header)) throw new Error("That file does not have a valid PDF signature.");

    setStage("Preparing your resume");
    const startResponse = await fetch("/api/resumes/uploads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileName: selectedFile.name, fileSize: selectedFile.size, contentType: "application/pdf" }),
    });
    if (!startResponse.ok) throw new Error(await responseError(startResponse));
    const session = await startResponse.json() as { uploadId: string; chunkSize: number; expectedChunks: number };

    for (let index = 0; index < session.expectedChunks; index += 1) {
      const chunk = selectedFile.slice(index * session.chunkSize, (index + 1) * session.chunkSize);
      const response = await fetch(`/api/resumes/uploads/${session.uploadId}/${index}`, {
        method: "PUT",
        headers: { "content-type": "application/octet-stream" },
        body: chunk,
      });
      if (!response.ok) throw new Error(await responseError(response));
      setProgress(Math.round(((index + 1) / session.expectedChunks) * 85));
    }

    setStage("Reading resume text");
    const completeResponse = await fetch(`/api/resumes/uploads/${session.uploadId}/complete`, { method: "POST" });
    if (!completeResponse.ok) throw new Error(await responseError(completeResponse));
    const completed = await completeResponse.json() as { resume: ResumeChoice };
    setProgress(100);
    setResumes((current) => [completed.resume, ...current]);
    return completed.resume.id;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    setProgress(0);
    try {
      const selectedResumeId = file ? await uploadResume(file) : resumeId;
      if (!selectedResumeId) throw new Error("Upload or choose a resume to continue.");
      setStage("Building your career plan");
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeId: selectedResumeId, jobDescription }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const { analysis } = await response.json() as { analysis: { id: string } };
      router.push(`/analysis/${analysis.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not complete this analysis.");
    } finally {
      setPending(false);
      setStage("");
    }
  }

  return (
    <form className="analysis-form" onSubmit={handleSubmit}>
      <div className="form-heading"><span className="form-step">01</span><div><h2>Start with the opportunity</h2><p>We will line up your experience with what the role asks for.</p></div><Sparkles size={19} /></div>
      <div className="form-fields">
        <fieldset className="resume-fieldset">
          <legend>Choose a resume</legend>
          {resumes.length > 0 && !file && <label className="field-label">Saved resumes<select value={resumeId} onChange={(event) => setResumeId(event.target.value)}><option value="">Select a resume</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.fileName}</option>)}</select></label>}
          <label className="upload-control">
            <input type="file" accept="application/pdf,.pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResumeId(""); setError(""); }} />
            <span className="upload-icon"><FileUp size={19} /></span>
            <span><strong>{file?.name ?? (resumes.length ? "Upload a different PDF" : "Choose your resume PDF")}</strong><small>PDF only · up to 15 MB</small></span>
          </label>
          {file && <button className="clear-file" type="button" onClick={() => { setFile(null); setResumeId(resumes[0]?.id ?? ""); }}>Use a saved resume instead</button>}
        </fieldset>
        <label className="field-label job-field">Job description<textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the internship or job description here..." required minLength={40} maxLength={20_000} rows={7} /><span>{jobDescription.length.toLocaleString()} / 20,000</span></label>
      </div>
      {pending && <div className="upload-progress" role="status"><div className="progress-label"><LoaderCircle size={15} className="spin" /><span>{stage || "Getting things ready"}</span><span>{progress}%</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="analysis-form-footer"><span>Your resume stays private to your account.</span><button className="button button-dark" type="submit" disabled={pending || jobDescription.trim().length < 40}>{pending ? "Working on it" : "Create my plan"}{!pending && <ArrowRight size={16} />}</button></div>
    </form>
  );
}