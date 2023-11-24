# daysoffplanner.com
Plan your accrued vacation throughout the year.

## Design
This project uses the simplest tools available so I can actually come back to it and understand how it works.

## Develop
Run `python3 -m http.server 8080`

## Deploy
Push.

## Monitor
https://analytics.google.com/analytics/web/#/p368862830/reports/intelligenthome

https://dashboard.stripe.com/dashboard

## Todo 
[x] Stripe integration: https://console.firebase.google.com/project/daysoffplanner/extensions/instances/firestore-stripe-payments?tab=usage
[x] Save, load days in firestore DB
[x] Remove cookie caching
[x] Implement unsubscribe
[x] Current balance broken, timeoff rate broken
[x] Loading page after sign up before stripe
[x] Loading page before signin
[x] Loading page before subscription
[] Holidays are off by 1
[] Forgot password
[] Pinned balance date is unimplemented
[] Mobile support or mobile unsupported page