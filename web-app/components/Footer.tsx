import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord, faYoutube, faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="pb-2 flex justify-center">
        <a href="https://NEAR.University" target="_blank" rel="noopener noreferrer">
          <img alt="NEAR University logo" width="200px" src="/near_university_logo.svg" />
        </a>
      </div>
      <div className="max-w-7xl mx-auto pb-12 px-4 overflow-hidden sm:px-6 lg:px-8 ">
        <div className="mt-8 flex justify-center space-x-6">
          <a href="https://twitter.com/NEARedu?s=2" className="text-base text-gray-500 hover:text-gray-900">
            <FontAwesomeIcon icon={faTwitter} style={{ width: '18px' }} />
          </a>
          <a href="https://discord.gg/k4pxafjMWA" className="text-base text-gray-500 hover:text-gray-900">
            <FontAwesomeIcon icon={faDiscord} style={{ width: '18px' }} />
          </a>
          <a href="https://www.instagram.com/near.university/?hl=en" className="text-base text-gray-500 hover:text-gray-900">
            <FontAwesomeIcon icon={faInstagram} style={{ width: '18px' }} />
          </a>
          <a href="https://www.youtube.com/c/NEARProtocol" className="text-base text-gray-500 hover:text-gray-900">
            <FontAwesomeIcon icon={faYoutube} style={{ width: '18px' }} />
          </a>
          <a href="https://github.com/NEAR-Edu" className="text-base text-gray-500 hover:text-gray-900">
            <FontAwesomeIcon icon={faGithub} style={{ width: '18px' }} />
          </a>
        </div>
      </div>
    </footer>
  );
}
