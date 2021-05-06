# g3tools-api

This is a Node/Express API application that fronts our company MySQL database.

## Setup

`npm install` 
`npm start`

## ADD NEW ENTITY

To add a new table/entity:

1. Create a new controller, like entity-name.js in the 1-controllers folder. This
   is a class that combines the model with the controller, since most of the work is
   done by the base.controller.js and base.db.js. This is where we define the table
   and fields, as well as validate.

2. Create a route file, like entity-name.route.js in the 0-routes folder.

3. Update /0-routes/index.js with the new end point, like /users.

## AUTHENTICATION

Using JWT (JSON Web Tokens) to authenticate all requests.

1. User logs in. The login function in auth-utils.js, compares the userid (email) and password
   passed in from the request with that stored in the database auth_user table. If exists and matches,
   generates a JWT and passes back to the user an accessToken and a refreshToken.

2. User passes in another request with the accessToken. Middleware function authenticateToken()
   in auth_utils.js, then checks if the token is blacklisted (logged out). If not, then verifies
   token is valid. If so, control is passed to the next function (route).

3. Client is responsible for storing accessToken and refreshToken, and returning the accessToken with
   every request, as well as calculating when the token expires (expiration date is included with the
   token), and then calling /tokens/refresh and passing the refreshToken.

Note that accessTokens expire in 10 minutes, while refreshTokens expire in 10 hours (set in auth-utils.js, generateAccessToken method). A user will need to re-login after the refreshToken expires.
