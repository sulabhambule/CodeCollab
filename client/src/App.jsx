function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Tailwind Check
          </h1>
          <p className="mt-2 text-gray-600">
            If these styles look applied, Tailwind is working.
          </p>
        </header>

        <section className="grid grid-cols-3 gap-4">
          <div className="h-24 rounded-lg bg-red-500 flex items-center justify-center text-white font-semibold">
            Red
          </div>
          <div className="h-24 rounded-lg bg-green-500 flex items-center justify-center text-white font-semibold">
            Green
          </div>
          <div className="h-24 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold">
            Blue
          </div>
        </section>

        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
              Primary
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition">
              Secondary
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type to test focus"
            />
          </div>
        </section>

        <footer className="text-sm text-gray-500">
          <div>Responsive classes applied — resize the window to test.</div>
        </footer>
      </div>
    </div>
  );
}

export default App;
