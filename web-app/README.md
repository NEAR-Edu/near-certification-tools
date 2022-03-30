# Overview

This project will be accessible at https://cert.near.university. See [deployment_notes.md](deployment_notes.md).

## Frontend

The index page will prompt the visitor to log in, after which it will display the list of certificates that they possess. Each cert will display a URL of its image (and eventually links or buttons that allow sharing it on Twitter).

## API Endpoints

### Generating the certificate (minting the NFT)

There is also an API endpoint ([/api/mint-cert](/web-app/pages/api/mint-cert.ts)) for generating a cert for a given mainnet address (and the endpoint will only function if a server-side secret is also provided in the payload).

See [sample_api_payload.json](/web-app/pages/api/sample_api_payload.json).

Airtable and Integromat are connected via a polling function in Integromat. Once every day or so, Integromat can poll Airtable to retrieve all certified developers, only grabbing the most recently added ones (since the last poll). In the Integromat flow, we have all the data from the submissions table that we need to issue a cert (including name, mainnet address, course, etc).

The Integromat flow then calls the [HTTP "app"](https://www.integromat.com/en/help/app/http) (Integromat calls each flow step an "app") and uses it to call out to this API endpoint, passing a payload of NCD data that mints a new NFT.

The next step in the Integromat flow is to email the recipient of the NCD with a link directly to their wallet where they can see the NFT (and also a link to this frontend).

### Viewing the dynamically-generated png image

Visitors can view the image at /api/cert/abcd.svg or /api/cert/abcd.png. See [/web-app/pages/api/cert/[imageFileName].ts](/web-app/pages/api/cert/[imageFileName].ts)

## Getting Started

```bash
cp web-app/.env web-app/.env.local
# Then edit those values. You'll need to replace the value of NEXT_PUBLIC_CERTIFICATE_CONTRACT_NAME with your own that you saw in the CLI. Ask Ryan for any other secrets.
yarn
yarn dev
```

The app is at [http://localhost:3000/api/cert/103216412112497cb6c193152a27c49a.svg](http://localhost:3000/api/cert/103216412112497cb6c193152a27c49a.svg) and [http://localhost:3000/api/mint-cert](http://localhost:3000/api/mint-cert).

## See also

- Keep in mind that through commit 2022-01-26 18:25:22 -0500 b44d3a9 there was a folder called "view-contract", where the original idea was to have the dynamic SVG/PNG image generation happen on the NEAR blockchain rather than on a centralized server. But we abandoned that approach due to high gas costs of cross-contract calls.
- This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
- Solving a TypeScript issue that happens when Render tries to build the project: https://community.render.com/t/deploy-a-github-sub-directory/1156/12

# Helpful tools

- https://github.com/fusebit/tunnel
- https://reqbin.com/post-online
