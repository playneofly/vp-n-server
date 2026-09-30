import Backdrop from "./components/Backdrop";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Diagnose from "./components/Diagnose";
import Scanner from "./components/Scanner";
import Forge from "./components/Forge";
import Fragment from "./components/Fragment";
import PatchKit from "./components/PatchKit";
import Guide from "./components/Guide";
import Faq from "./components/Faq";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="noise relative min-h-screen text-ink">
      <Backdrop />
      <Header />
      <main>
        <Hero />
        <Diagnose />
        <Scanner />
        <Forge />
        <Fragment />
        <PatchKit />
        <Guide />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
