// resume PDF viewer (iframe)
import type { Metadata } from 'next';

import site from '../../content/site.json';

export const metadata: Metadata = {
  title: `Resume — ${site.meta.siteName}`,
  description: `Resume for ${site.meta.siteName}, ${site.meta.jobTitle}.`
};

export default function ResumePage() {
  const resume = site.resume ?? {};
  const resumeUrl = resume.filePath;

  return (
    <main className="py-5">
      <div className="container d-flex flex-column gap-4">
        <header className="reveal">
          <h1 className="h3 text-white mb-2">Resume</h1>
          <p className="text-muted-custom mb-0">
            {resumeUrl
              ? 'PDF viewer is best viewed on desktop. You can also download it below.'
              : 'Upload your PDF resume to `public/Assets/resume_fin.pdf` (or update `content/site.json > resume.filePath`) to enable the viewer.'}
          </p>
        </header>
        {resumeUrl ? (
          <>
            <div className="ratio ratio-4x3 hero-panel reveal" style={{ minHeight: '70vh' }}>
              <iframe
                title="Resume PDF"
                src={resumeUrl}
                className="w-100 h-100 border-0 rounded-4"
                loading="lazy"
              />
            </div>
            <div className="reveal">
              <a className="btn btn-primary" href={resumeUrl} download>
                Download resume
              </a>
            </div>
          </>
        ) : (
          <div className="hero-panel p-4 reveal">
            <p className="mb-3 text-muted-custom">
              No resume file is committed to the repository so GitHub pull requests avoid binary diffs.
            </p>
            <ol className="mb-3 small text-muted-custom ps-4">
              <li>Place your PDF at <code>public/Assets/resume_fin.pdf</code>.</li>
              <li>Or set <code>content/site.json → resume.filePath</code> to your hosted PDF URL.</li>
              <li>Commit the change outside GitHub PRs if the file is large.</li>
            </ol>
            <p className="mb-0 small text-muted-custom">
              See the README “Resume asset” section for more details.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
