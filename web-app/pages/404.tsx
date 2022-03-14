export default function ErrorPage404() {
  return (
    <div className="bg-white px-4 py-16 sm:px-6 sm:py-24 sm:h-screen md:grid md:place-content-center lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <div className="sm:ml-6">
            <div className="sm:pl-6">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Page not found</h1>
              <p className="mt-1 text-base text-gray-500">There is no page at this address.</p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Go back home
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
