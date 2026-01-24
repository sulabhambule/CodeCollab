export default function Toast({ message, type }) {
  return (
    <div
      className={`px-4 py-2 rounded shadow-lg text-sm
        ${type === "error" ? "bg-red-600" : "bg-green-600"}
      `}
    >
      {message}
    </div>
  );
}
