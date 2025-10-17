// Skills chip lists
import site from '../content/site.json';

type SkillsContent = typeof site.skills;

export default function SectionSkills({ content = site.skills }: { content?: SkillsContent }) {
  return (
    <section id={content.id} className="section-divider py-5 position-relative" tabIndex={-1}>
      <div className="container">
        <div className="reveal">
          <h2 className="h3 mb-4 text-white">{content.title}</h2>
        </div>
        <div className="d-flex flex-wrap gap-2 reveal" aria-label="Skills list">
          {content.items.map((skill) => (
            <span key={skill} className="skill-chip">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
