import { useEffect, useState } from "react";

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative space-y-8 overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse opacity-30 duration-7000"></div>
      <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse opacity-30 duration-7000"></div>

      {/* Badge with entrance animation */}
      <div
        className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer group">
          <span className="inline-block group-hover:animate-spin">🚀</span>
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
            Now in Beta
          </span>
        </span>
      </div>

      {/* Heading with staggered animation */}
      <div
        className={`transition-all duration-1000 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <h1 className="text-6xl md:text-5xl font-black leading-tight tracking-tight">
          <span
            className="block text-white animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Code together,
          </span>
          <span
            className="block text-white mt-2 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            create together,
          </span>
          <span className="block mt-3 h-20 md:h-24 flex items-center">
            <span
              className="inline-block bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift"
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              ship together.
            </span>
          </span>
        </h1>
      </div>

      {/* Subtitle with fade-in animation */}
      <div
        className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed">
          <span className="inline-block">
            A seamless collaborative coding platform where teams connect
            instantly.
          </span>
          <br />
          <span className="inline-block mt-2 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
            Real-time synchronization, powerful VS Code editor, zero setup
            required.
          </span>
        </p>
      </div>

      {/* Credibility with hover effect */}
      <div
        className={`transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="inline-flex flex-wrap gap-4 pt-4">
          {["React", "Node.js", "Socket.IO"].map((tech, idx) => (
            <span
              key={tech}
              className="text-sm font-medium text-gray-400 px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:border-indigo-500/50 hover:text-indigo-400 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 cursor-default group"
              style={{ animationDelay: `${600 + idx * 100}ms` }}
            >
              <span className="group-hover:scale-110 inline-block transition-transform duration-300">
                {tech}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
