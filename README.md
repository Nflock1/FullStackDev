# Error Handling for all routes meantioned below:

if an error occurs in the server, rather than throwing a general error with status code 500, a custom error schema is given to the client in the resolution of the api call which aims to provide more useful information to the client. This schema includes: an 'error' boolean for if an error occured; a formatted 'message' field relative to the error that occurred (this is the most comprehensive explanation besides what is logged on the server) ; an 'errorName' field containing the error name and an 'errorCode' field which provides an error code if it exists, otherwise the 'errorCode' field remains undefined.

# Api available routes

call: post  
route:'/api/signup'  
required fields for req.body: username, password, email  
on sucess returns: resolution with fields 'qr', containing a URL to the image fo a QR code, and 'message', contianing a relevant sucess message, with a status code 200 upon a sucessfull request.  
on fail returns: an error with status 298.

call: post  
route: '/api/2fa_login'  
required fields for req.body: password, email  
on sucess returns: JWT "token" cookie to the requestor's session, a relevant sucess message in the 'message' field, and a user object field which contains the users 'username' , 'email', and 'count' (Number) for the user. this response comes with a status code 200.  
on fail returns: an error or a status code 298 with a relevant failure message in the 'message' field

call: post  
route: '/api/verify_login'  
required fields for req.body: email, password  
on sucess returns: a relevant success message in the 'message' field and a status code fo 200. If the user being verified has not set up 2fa yet, then a url to an image of a qr code will also be returned in the 'qr' field  
on fail returns: an error or a 298 status code with a relevant failure message in the 'message' field

call: post  
route: '/api/count'  
required fields for req.body: none  
on sucess returns: a status of 200 with a relevant sucess message in the 'message' field and the user's current count in the 'count' field  
on fail returns: an error with status 298.

call: delete  
route: '/api/clear_token'  
required fields for req.body: none  
on sucess returns: a status of 200 with a relevant sucess message in the 'message' field  
on fail returns: an error with status code 298 (though there should never be a fail case unless the server crashes mid request fulfillment)

all routes: JWT and CSRF token middleware  
on sucessfull authentication of either of these tokens, no status is applied since the status will be determined later in execution. If authentication of JWT is unsuccessfull, then a status code of 299 will be returned with the response fields 'error' and 'loggedOut' set to true. The same error schema is used to report this error, but custom error names and codes are implemented for some paths. On failed CSRF validation, a status code of 403 is applied (note the code switch is not necessary here because the nature of the error handling in this path will induce an acios error to be thrown), and an error of the same schema previously meantioned is returned.

# necessary headers for all routes:

'x-csrf-token' - or another default listed at https://www.npmjs.com/package/csurf

# additional notes:

NOTE ON TOKENS AND AUTHENTICATION: JWT's are automatically stored in the client's cookies, so they do not need to be tracked manually so long as one is automatically submitting cookies (as is normally the case). However, a delete reqeust is necesary for the server to clear the JWT cookie. Since JWTs are stored in cookies, the client will have to securely keep track of a CSRF token which will need to be passed as a header when making requests (see necessary headers).
This is done in react state in this program.

NOTE ON STATUS CODES: status codes used here stay within the 200's or else Axios comandeers the response object and creates it's own error messages.
to avoid unexpected response structures and to provide clarity in errors, a custom system of coding is used where:

used here <-> standard
298 <-> 400
299 <-> 401
200 <-> 200
