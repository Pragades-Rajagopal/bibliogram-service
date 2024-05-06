export default {
  databaseErrors: {
    unique_constraint: "UNIQUE constraint failed",
    constraint: "SQLITE_CONSTRAINT",
  },
  statusCode: {
    success: 200,
    error: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    serverError: 500,
  },
  user: {
    registered: "User registered successfully",
    notRegistered: "User not registered",
    invalidAuth: "Private key is not correct",
    logoutSuccess: "User logged out successfully",
    deactivationSuccess: "User successfully deactivated",
    deactivationError: "Error while deactivating user",
  },
  authenticationMessage: {
    tokenMissing: "Please send auth token in request header",
    invalidToken: "Invalid token! Cannot authenticate at this moment",
  },
  commonServerError: {
    internal: "Internal Server Error",
    badRequest: "Bad request",
    forbidden: "You do not have access to this operation",
  },
  loginService: {
    hash: {
      success: "Private key hashed",
      error: "Error while hashing the private key",
    },
    verification: {
      success: "User verified",
      error: "Error while verifying the private key",
    },
  },
};
