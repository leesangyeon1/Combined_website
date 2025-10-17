//Project Card grid
import Link from 'next/link';

import site from '../content/site.json';

type ProjectsContent = typeof site.projects;

type Project = ProjectsContent['items'][number];

export default function SectionProjects({ content = site.projects }: { content?: ProjectsContent }) {
  return (
    <section id={content.id} className="section-divider py-5 position-relative" tabIndex={-1}>
      <div className="container">
        <div className="reveal">
          <h2 className="h3 mb-4 text-white">{content.title}</h2>
        </div>
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {content.items.map((project: Project) => (
            <div key={project.title} className="col reveal">
              <article className="card-panel h-100 p-4">
                <h3 className="h5 text-white mb-2">{project.title}</h3>
                <p className="text-muted-custom small mb-3">{project.description}</p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {project.stack.map((item) => (
                    <span key={item} className="skill-chip">
                      {item}
                    </span>
                  ))}
                </div>
                {project.link ? (
                  <Link href={project.link.href} target="_blank" rel="noreferrer noopener" className="text-decoration-none">
                    {project.link.label}
                  </Link>
                ) : null}
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
