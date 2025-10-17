// Home((Hero, About, Experience, Projects, Skills, Contact)))
import Hero from '../components/Hero';
import SectionAbout from '../components/SectionAbout';
import SectionContact from '../components/SectionContact';
import SectionExperience from '../components/SectionExperience';
import SectionProjects from '../components/SectionProjects';
import SectionSkills from '../components/SectionSkills';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <SectionAbout />
      <SectionExperience />
      <SectionProjects />
      <SectionSkills />
      <SectionContact />
    </main>
  );
}
