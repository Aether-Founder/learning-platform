import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { FlashcardSection } from '../components/flashcard-section';
import { Sidebar } from '../components/sidebar';
import { flashcardSections } from '../lib/flashcard-data';

export default function Home() {
  return (
    <>
      <Sidebar />
      <main className="min-h-screen bg-background xl:ml-[280px]">
        <div className="max-w-[720px] mx-auto px-5 py-10 md:py-14">
          <Header />

          <div className="space-y-5">
            {flashcardSections.map((section) => (
              <FlashcardSection key={section.id} section={section} />
            ))}
          </div>

          <Footer />
        </div>
      </main>
    </>
  );
}
