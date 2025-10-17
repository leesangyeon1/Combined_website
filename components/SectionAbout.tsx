//About 섹션
import site from '../content/site.json';

type AboutContent = typeof site.about;

export default function SectionAbout({ content = site.about }: { content?: AboutContent }) {
  return (
    <section id={content.id} className="section-divider py-5 position-relative" tabIndex={-1}>
      <div className="container reveal">
        <h2 className="h3 mb-3 text-white">{content.title}</h2>
        <p className="text-muted-custom mb-0">{content.body}</p>
      </div>
    </section>
  );
}
