// Contact 섹션 wrapper (Form 포함)
import ContactForm from './ContactForm';
import site from '../content/site.json';

type ContactContent = typeof site.contact;

type Props = {
  content?: ContactContent;
};

export default function SectionContact({ content = site.contact }: Props) {
  return (
    <section id={content.id} className="py-5 position-relative" tabIndex={-1}>
      <div className="container d-flex flex-column gap-4">
        <div className="reveal">
          <h2 className="h3 mb-3 text-white">{content.title}</h2>
          <p className="text-muted-custom mb-0">{content.body}</p>
        </div>
        <ContactForm action={content.form.action} nextUrl={content.form.next} replyEmail={content.form.email} />
      </div>
    </section>
  );
}
