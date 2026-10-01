"use client";

import { useState } from "react";
import type { CareerAnalysisResult } from "@/lib/validation/schemas";

type InterviewSet = CareerAnalysisResult["interviews"];
type InterviewCategory = keyof InterviewSet;

const tabs: { key: InterviewCategory; label: string }[] = [
  { key: "technical", label: "Technical" },
  { key: "behavioral", label: "Behavioral" },
  { key: "resumeSpecific", label: "Your resume" },
];

export function InterviewTabs({ interviews }: { interviews: InterviewSet }) {
  const [active, setActive] = useState<InterviewCategory>("technical");
  return (
    <div className="interview-panel">
      <div className="interview-tabs" role="tablist" aria-label="Interview question type">
        {tabs.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={active === tab.key} onClick={() => setActive(tab.key)}>{tab.label}<span>{interviews[tab.key].length}</span></button>)}
      </div>
      <div className="question-list" role="tabpanel">
        {interviews[active].map((item, index) => <article className="question-item" key={`${active}-${index}`}><span className="question-index">Q{String(index + 1).padStart(2, "0")}</span><div><h3>{item.question}</h3><p className="question-intent">{item.whyItMatters}</p><details><summary>Plan your answer</summary><p>{item.answerApproach}</p></details></div></article>)}
      </div>
    </div>
  );
}