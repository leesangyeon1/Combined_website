// Experience Timeline
import site from '../content/site.json';

type ExperienceContent = typeof site.experience;

type Role = ExperienceContent['roles'][number];

export default function SectionExperience({ content = site.experience }: { content?: ExperienceContent }) {
  return (
    <section id={content.id} className="section-divider py-5 position-relative" tabIndex={-1}>
      <div className="container">
        <div className="reveal">
          <h2 className="h3 mb-4 text-white">{content.title}</h2>
        </div>
        <div className="position-relative ps-4 ps-sm-5">
          <div className="timeline position-relative">
            {content.roles.map((role: Role) => (
              <article key={role.title} className="position-relative ps-4 pb-4 timeline-item reveal">
                <h3 className="h5 text-white mb-2">
                  {role.title} <span className="text-muted-custom">— {role.period}</span>
                </h3>
                <ul className="text-muted-custom small mb-0 ps-3">
                  {role.highlights.map((item) => (
                    <li key={item} className="mb-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
