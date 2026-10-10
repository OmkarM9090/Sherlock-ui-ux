import Navbar from "./Navbar";
import Hero from "./Hero";
import ScrollStory from "./ScrollStory";
import Features from "./Features";

export default function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <>
      <Navbar onEnter={onEnter} />
      <main className="landing-filmgrade">
        <Hero onEnter={onEnter} />
        <ScrollStory onEnter={onEnter} />
        <Features />
      </main>
    </>
  );
}
