import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import TopNav from "../components/TopNav";


export default function Home() {
  return (
    <div className="bg-[#0a0a0a] text-white">
      <main className="relative">
        <div className="absolute top-0 left-0 right-0 z-20">
          <TopNav />
        </div>
        <Hero />
        <Features />
      </main>
    </div>
  );
}