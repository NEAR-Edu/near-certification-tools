import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord, faYoutube, faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons';

export default function FooterSocials() {
  return (
    <div className="flex justify-center mr-5 pt-5 pb-5 items-center space-x-4">
      <a href="https://twitter.com/NEARedu?s=2" target="_blank" rel="noopener noreferrer" className="text-base text-gray-500 hover:text-gray-900">
        <FontAwesomeIcon icon={faTwitter} style={{ width: '18px' }} />{' '}
      </a>{' '}
      <a href="https://discord.gg/k4pxafjMWA" target="_blank" rel="noopener noreferrer" className="text-base text-gray-500 hover:text-gray-900">
        <FontAwesomeIcon icon={faDiscord} style={{ width: '18px' }} />{' '}
      </a>{' '}
      <a href="https://www.instagram.com/near.university/?hl=en" target="_blank" rel="noopener noreferrer" className="text-base text-gray-500 hover:text-gray-900">
        <FontAwesomeIcon icon={faInstagram} style={{ width: '18px' }} />{' '}
      </a>{' '}
      <a href="https://www.youtube.com/c/NEARProtocol" target="_blank" rel="noopener noreferrer" className="text-base text-gray-500 hover:text-gray-900">
        <FontAwesomeIcon icon={faYoutube} style={{ width: '18px' }} />{' '}
      </a>{' '}
      <a href="https://github.com/NEAR-Edu" target="_blank" rel="noopener noreferrer" className="text-base text-gray-500 hover:text-gray-900">
        <FontAwesomeIcon icon={faGithub} style={{ width: '18px' }} />{' '}
      </a>
    </div>
  );
}
