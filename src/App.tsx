import Header from "./components/Header";
import Hero from "./components/Hero";
import Generator from "./components/Generator";
import Guide from "./components/Guide";
import Faq from "./components/Faq";
import Footer from "./components/Footer";
import Toaster from "./components/Toaster";

export default function App() {
  return (
    <div className="relative min-h-screen bg-night-900 text-white">
      <Header />
      <main>
        <Hero />
        <div className="shine-line mx-auto max-w-5xl" />
        <Generator />
        <div className="shine-line mx-auto max-w-5xl" />
        <Guide />
        <div className="shine-line mx-auto max-w-5xl" />
        <Faq />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
