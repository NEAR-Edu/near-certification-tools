# Overview

This project will be accessible at https://cert.near.university (and hosted via https://render.com).

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
yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## See also

- Keep in mind that through commit 2022-01-26 18:25:22 -0500 b44d3a9 there was a folder called "view-contract", where the original idea was to have the dynamic SVG/PNG image generation happen on the NEAR blockchain rather than on a centralized server. But we abandoned that approach due to high gas costs of cross-contract calls.
- This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## TODO

1. fix mint-cert.ts
1. update background.svg
1. update generateImage with design
1. create the index page to list out the logged-in visitor's certificates
1. Add Google Analytics
