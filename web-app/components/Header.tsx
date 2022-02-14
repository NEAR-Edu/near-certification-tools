export default function Header() {
  return (
    <div className="bg-white shadow">
      <div className="mx-auto">
        <div className="flex justify-start h-16">
          <a href="/">
            <div className="flex items-center">
              <img className="lg:block h-16 w-auto" src="/near_icon.svg" alt="Workflow" />
              <p className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">NEAR University Certificate Browser</p>
            </div>
          </a>
          <div className="relative">
            <a href="https://jobs.near.university/">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <p className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">Jobs</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
