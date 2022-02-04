# Overview

This project will be accessible at https://cert.near.university (and hosted via https://dashboard.render.com/web/srv-c7sqr03ru51p1aabjuk0/settings).

## Frontend

The index page will prompt the visitor to log in, after which it will display the list of certificates that they possess. Each cert will display a URL of its image (and eventually links or buttons that allow sharing it on Twitter).

## API Endpoints

### Generating the certificate (minting the NFT)

There is also an API endpoint ([/api/mint-cert](/web-app/pages/api/mint-cert.ts)) for generating a cert for a given mainnet address (and the endpoint will only function if a server-side secret is also provided in the payload).

Airtable and Integromat are connected via a polling function in Integromat. Once every day or so, Integromat can poll Airtable to retrieve all certified developers, only grabbing the most recently added ones (since the last poll). In the Integromat flow, we have all the data from the submissions table that we need to issue a cert (including name, mainnet address, course, etc).

The Integromat flow then calls the [HTTP "app"](https://www.integromat.com/en/help/app/http) (Integromat calls each flow step an "app") and uses it to call out to this API endpoint, passing a payload of NCD data that mints a new NFT.

The next step in the Integromat flow is to email the recipient of the NCD with a link directly to their wallet where they can see the NFT (and also a link to this frontend).

### Viewing the dynamically-generated png image

Visitors can view the image at /api/cert/abcd.svg or /api/cert/abcd.png. See [/web-app/pages/api/cert/[imageFileName].ts](/web-app/pages/api/cert/[imageFileName].ts)

## Getting Started

```bash
cp web-app/.env.local.example web-app/.env
# Then edit those values. You'll need to replace the value of NEXT_PUBLIC_CERTIFICATE_CONTRACT_NAME with your own that you saw in the CLI. Ask Ryan for any other secrets.
yarn
yarn dev
```

The app is at [http://localhost:3000/api/cert/303216412112497cb6c193152a27c49c.svg](http://localhost:3000/api/cert/303216412112497cb6c193152a27c49c.svg) and [http://localhost:3000/api/mint-cert](http://localhost:3000/api/mint-cert).

## See also

- Keep in mind that through commit 2022-01-26 18:25:22 -0500 b44d3a9 there was a folder called "view-contract", where the original idea was to have the dynamic SVG/PNG image generation happen on the NEAR blockchain rather than on a centralized server. But we abandoned that approach due to high gas costs of cross-contract calls.
- This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
- Solving a TypeScript issue that happens when Render tries to build the project: https://community.render.com/t/deploy-a-github-sub-directory/1156/12

# TODO

## Ryan:

1. fix fetchCertificateDetails
   1. Will we show competencies? Expiration? How will we dynamically calculate the expiration date? https://discord.com/channels/828768337978195969/906115083250307103/938190056429092924 has hints.
1. figure out correct var values for the `.env` file
1. Get access to Integromat (and Airtable if necessary), and paste our `API_KEY` (the arbitrary one in our `.env` file) into the appropriate place in Integromat's HTTP app.
1. Ask Sherif to map his desired subdomain to the specific path at render.com/example
1. Ensure that HTTP is blocked (because HTTPS is enforced via `web-app/pages/_middleware.ts`). (We wouldn't want `web-app/pages/api/mint-cert.ts` exposed via HTTP because our secret `API_KEY` would be leaked, and anyone could issue any certificate.)
   1. 2022-02-02 13:00 ET http://near-certification-tools.onrender.com/ does seem to successfully redirect to https://near-certification-tools.onrender.com/ but we'll want to test the minting later.
1. Sherif will deploy the production contract.
1. Add documentation here about Integromat, etc
1. Configure https://github.com/NEAR-Edu/near-certification-tools/settings/branch_protection_rules/new
1. Lower priority improvements:
   1. Add cert text details to `web-app/pages/certificate/[tokenId].tsx` but consider efficiency; it should fetch certificate data just once, and then pass that to the image generator. fetchCertificateDetails should not be inside `web-app/pages/api/cert/[imageFileName].ts`

## Ozan and Çağatay to split up:

(In approximate order of importance, but you can sometimes make progress on multiple items at once.)

Especially when working on a team that lives across time zones, it's important to overcommunicate and also always push your commits to the GitHub repo at the end of each day (or ideally even more frequently than that) so that we can all stay aware of progress and not double-do work.

1. Work with Dan to:
   - make sure he provides you a background SVG file for each program's certificate + designs for what the final output should look like once text is inserted. (This is a blocker for the `generateImage` task below.)
   - get his input on the overall design of the pages mentioned below. But this is less important than his design for the certificate images themselves. If Dan is too busy, consider just doing your best to improve how our site looks (using Tailwind themes/templates, which I don't know how to do yet, or maybe Bootstrap).
1. Once you have Dan's designs, in `web-app/pages/api/cert/[imageFileName].ts`, update generateImage with designs for each program's certificate
1. improve the design of:

   - `web-app/components/Layout.tsx`
   - `web-app/pages/index.tsx`
   - `web-app/pages/account/[account].tsx`
   - `web-app/pages/certificate/[tokenId].tsx`

1. Learn about Open Graph https://ogp.me/. Edit the `<head>` tag (in a NextJs way) of the `web-app/pages/certificate/[tokenId].tsx` page to include social metadata to make that page generate a preview when people share it on social platforms. E.g. https://www.linkedin.com/post-inspector/ and https://cards-dev.twitter.com/validator will show you what sharing any particular URL will look like. Since we're working on localhost and don't automatically have a publicly-viewable URL, you'll probably need to generate a temporary public URL for your machine using localtunnel https://theboroer.github.io/localtunnel-www/ or something similar (in order to use those sharing-preview tools).
1. Check that the sharing buttons at http://localhost:3000/certificate/303216412112497cb6c193152a27c49c successfully post to Twitter and LinkedIn. (See note above about localtunnel).
1. Add Google Analytics tracking to the layout. You'll probably need to work with Sherif (get him to give you whatever tracking ID you need).
1. Stay aware of what others (e.g. Ryan) are working on. Take opportunities whenever you can to volunteer to move a specific task off my list and onto your list. Any time you can stretch into doing something more difficult is a win for all of us.
