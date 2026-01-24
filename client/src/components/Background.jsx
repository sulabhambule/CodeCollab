// components/Background.jsx
export default function Background() {
  return (
    <>
      <div className="fixed inset-0 bg-[#0b0f1a]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,#ffffff15_1px,transparent_0)] bg-size-[40px_40px]" />
      <div className="fixed inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
    </>
  );
}
