import './index.css';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { PainPoints } from './components/sections/PainPoints';
import { HowItWorks } from './components/sections/HowItWorks';
import { Features } from './components/sections/Features';
import { Audience } from './components/sections/Audience';
import { FinalCTA } from './components/sections/FinalCTA';
import { Footer } from './components/layout/Footer';
import { LogoTicker } from './components/sections/LogoTicker';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <LogoTicker />
        <PainPoints />
        <HowItWorks />
        <Features />
        <Audience />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
