import { Link } from "react-router-dom";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listSections,
  phaseOneDocumentMeta,
  tableSections,
  textSections,
} from "@/data/phaseOneProjectDocument";
import {
  ProjectDocumentSection,
  ProjectDocumentTable,
} from "@/components/project-document/ProjectDocumentSection";

const ProjectDocument = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(140deg,#e9f2ff_0%,#f4f9ff_38%,#e7f0ff_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.2),transparent_32%),radial-gradient(circle_at_80%_8%,rgba(37,99,235,0.15),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.12),transparent_34%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,248,255,0.84))] p-6 shadow-[0_30px_70px_-38px_rgba(21,75,126,0.72)] backdrop-blur-md sm:p-8">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute right-12 top-10 hidden h-24 w-24 rounded-2xl border border-white/40 bg-white/25 backdrop-blur-xl lg:block" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/">
                <Button variant="outline" className="h-9 rounded-lg border-slate-300 bg-white/80 text-slate-700 hover:bg-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <span className="inline-flex items-center rounded-full border border-cyan-300 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-800 shadow-sm">
                Client Presentation Ready
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{phaseOneDocumentMeta.currentPhase} Project Document</p>
              <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {phaseOneDocumentMeta.title}
              </h1>
              <p className="mt-2 text-xl font-medium text-slate-700 sm:text-2xl">{phaseOneDocumentMeta.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200/90 bg-white/85 px-4 py-3 shadow-[0_8px_20px_-16px_rgba(2,32,71,0.7)]">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Prepared for</p>
                <p className="text-sm font-semibold text-slate-800">{phaseOneDocumentMeta.preparedFor}</p>
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-white/85 px-4 py-3 shadow-[0_8px_20px_-16px_rgba(2,32,71,0.7)]">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Project type</p>
                <p className="text-sm font-semibold text-slate-800">{phaseOneDocumentMeta.projectType}</p>
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-white/85 px-4 py-3 shadow-[0_8px_20px_-16px_rgba(2,32,71,0.7)]">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Current phase</p>
                <p className="text-sm font-semibold text-slate-800">{phaseOneDocumentMeta.currentPhase}</p>
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-white/85 px-4 py-3 shadow-[0_8px_20px_-16px_rgba(2,32,71,0.7)]">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Prepared on</p>
                <p className="text-sm font-semibold text-slate-800">{phaseOneDocumentMeta.preparedOn}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs text-slate-600 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-cyan-700" />
              Phase-1 focus: secure role-based web portals and core workflow digitization
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
          {textSections.map((section, sectionIndex) => (
            <ProjectDocumentSection key={section.title} title={section.title}>
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.title}-${index}`} className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                  {paragraph}
                </p>
              ))}
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Section {sectionIndex + 1}
              </p>
            </ProjectDocumentSection>
          ))}

          {tableSections.map((table) => (
            <ProjectDocumentSection key={table.title} title={table.title}>
              <ProjectDocumentTable columns={table.columns} rows={table.rows} />
            </ProjectDocumentSection>
          ))}

          {listSections.map((section) => (
            <ProjectDocumentSection key={section.title} title={section.title}>
              <ul className="space-y-2">
                {section.bullets.map((bullet, index) => (
                  <li key={`${section.title}-${index}`} className="flex gap-2.5 text-sm leading-7 text-slate-700 sm:text-[15px]">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-600 ring-4 ring-cyan-100" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </ProjectDocumentSection>
          ))}
        </main>

        <footer className="mt-8 rounded-2xl border border-slate-200 bg-white/85 px-5 py-4 text-sm text-slate-600 shadow-[0_14px_34px_-26px_rgba(24,63,110,0.7)]">
          <p className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-700" />
            Document preserved in Phase-1 structure for client presentation and implementation alignment.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ProjectDocument;
