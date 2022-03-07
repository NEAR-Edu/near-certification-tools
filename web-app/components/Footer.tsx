import FooterSocials from './FooterSocials';

export default function Footer() {
  return (
    <footer className="bg-gray-100 shadow-[1px_1px_10px_1px_rgba(0,0,0,0.2)]">
      <div className="mx-auto px-4 flex items-center justify-center">
        <a className="pt-5 mr-8 pb-5" href="https://NEAR.University" target="_blank" rel="noopener noreferrer">
          <img className="min-w-full" alt="NEAR University logo" width="200px" src="/near_university_logo.svg" />
        </a>
        <FooterSocials />
        <a href="https://jobs.near.university/" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-gray-500 hover:text-gray-900 py-5">
          Jobs
        </a>
      </div>
    </footer>
  );
}
