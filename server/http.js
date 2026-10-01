export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function publicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phoneNumber: user.phoneNumber,
    matricNumber: user.matricNumber,
    level: user.level,
    university: {
      id: user.university.id,
      fullName: user.university.fullName,
      shortCode: user.university.shortCode,
      state: user.university.state,
      campusLocations: user.university.campusLocations
    },
    isVerified: user.isVerified,
    agreedToTerms: user.agreedToTerms,
    accountStatus: user.accountStatus,
    role: user.role
  };
}
