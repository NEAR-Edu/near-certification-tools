// https://stackoverflow.com/a/70311570/470749
// Redirects http to https. This is helpful if you are hosting your site on a service that doesn't have "force ssl" support out of the box (IE: heroku).
import sslRedirect from 'next-ssl-redirect-middleware'; // https://github.com/ChuckJonas/next-ssl-redirect-middleware

export default sslRedirect({});
