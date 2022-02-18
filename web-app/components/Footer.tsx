import FooterSocials from './FooterSocials';

const navigation = [{ name: 'Jobs', href: 'https://jobs.near.university/' }];

export default function Footer() {
  return (
    <footer className="bg-gray-100 shadow-[1px_1px_10px_1px_rgba(0,0,0,0.2)]">
      <div className="mx-auto px-4 sm:px-4 sm:flex sm:items-center md:justify-start">
        <div className="flex justify-center pt-5 sm:mr-32 space-x-6 sm:pb-5">
          <div className=" md:order-1">
            <a href="https://NEAR.University" target="_blank" rel="noopener noreferrer">
              <img className="min-w-full" alt="NEAR University logo" width="200px" src="/near_university_logo.svg" />{' '}
            </a>
          </div>
        </div>
        <FooterSocials />
        <div className="flex justify-center space-x-6 py-5">
          {navigation.map((item) => (
            <div key={item.name} className="">
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-gray-500 hover:text-gray-900">
                {item.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
