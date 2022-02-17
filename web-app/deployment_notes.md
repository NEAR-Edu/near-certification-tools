# Web app server hosted by Render.com

https://dashboard.render.com/web/srv-c821j246fj315u4tlj90/settings

## Build Command

`cd web-app; yarn; yarn build`

## Start Command

`cd web-app; yarn start`

## Branch

main

## Auto Deploy

yes

## Environment variables

Keep in mind that you can't just use the "secret file" feature and paste the contents of your `.env.local` and tell it to save the file as `.env.local` because it would save at the root of the whole project rather than where it needs to be, which is at `web-app/.env.local`. So, instead, you need to add env key-value pairs one by one manually at the linked Environment Group here: https://dashboard.render.com/env-group/evg-c822des6fj315u4tmckg

All new commits to `main` branch get automatically deployed. Changing variables in the Environment Group also triggers a redeployment.

# Integration between a data source and the mint-cert API endpoint

https://www.integromat.com/scenario/2983577/edit

Integromat offers an "HTTP" "scenario", which allows us to post JSON data to /api/mint-cert, along with a header that includes our arbitrary API key (defined in our .env.local file or in the Environment Group on Render as mentioned above).

# Main URLs to test

- https://near-certification-tools-tpq1.onrender.com/
- https://near-certification-tools-tpq1.onrender.com/account/hatchet.testnet
- https://near-certification-tools-tpq1.onrender.com/certificate/103216412112497cb6c193152a27c49a
- https://near-certification-tools-tpq1.onrender.com/api/cert/103216412112497cb6c193152a27c49a.svg
- https://near-certification-tools-tpq1.onrender.com/api/cert/103216412112497cb6c193152a27c49a.png
- https://near-certification-tools-tpq1.onrender.com/api/mint-cert (post JSON data and API key header)
