import User from "../models/User.js";

// Operacoes de persistencia para usuarios.
class UserRepository {
  static async create(doc) {
    return User.create(doc);
  }

  static async findById(id) {
    return User.findById(id);
  }

  static async findByEmail(email) {
    if (!email) return null;
    return User.findOne({ email: String(email).toLowerCase().trim() });
  }

  static async existsByEmail(email) {
    if (!email) return false;
    const found = await User.exists({ email: String(email).toLowerCase().trim() });
    return Boolean(found);
  }

  static async findByGoogleId(googleId) {
    if (!googleId) return null;
    return User.findOne({ googleId });
  }

  static async findByEmailVerificationTokenHash(hash) {
    if (!hash) return null;
    return User.findOne({ emailVerificationTokenHash: hash });
  }

  static async findByPasswordResetTokenHash(hash) {
    if (!hash) return null;
    return User.findOne({ passwordResetTokenHash: hash });
  }

  static async updateById(id, update) {
    return User.updateOne({ _id: id }, update);
  }

  static async countByRole(role) {
    return User.countDocuments(role ? { role } : {});
  }
}

export default UserRepository;
