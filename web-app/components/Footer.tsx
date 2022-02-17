import FooterSocials from './FooterSocials';

const navigation = [{ name: 'Jobs', href: 'https://jobs.near.university/' }];

export default function Footer() {
  return (
    <footer className="bg-gray-100 shadow-[1px_1px_10px_1px_rgba(0,0,0,0.2)]">
      <div className="mx-auto py-4 px-4 sm:px-6 md:flex md:items-center md:justify-between">
        <div className="flex justify-center space-x-6 pb-12 md:pb-0">
          <div className="mt-8 md:mt-0 md:order-1">
            <a href="https://NEAR.University" target="_blank" rel="noopener noreferrer">
              <img alt="NEAR University logo" width="200px" src="/near_university_logo.svg" />{' '}
            </a>
          </div>
        </div>
        <FooterSocials />
        <div className="flex justify-center space-x-6">
          {navigation.map((item) => (
            <div key={item.name} className="px-5 py-2">
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
