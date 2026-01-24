import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JoinPanel from "../components/JoinPanel";

export default function Home() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center pt-24">
        <Hero />
        <JoinPanel />
      </main>
    </div>
  );
}
