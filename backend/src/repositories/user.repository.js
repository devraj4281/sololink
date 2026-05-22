import User from "../models/User.js";

class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findByIdWithoutPassword(id) {
    return User.findById(id).select("-password");
  }

  async findOne(query) {
    return User.findOne(query);
  }

  async findOneWithoutPassword(query) {
    return User.findOne(query).select("-password");
  }

  async create(data) {
    return User.create(data);
  }

  async findByIdAndUpdate(id, data, options = { new: true }) {
    return User.findByIdAndUpdate(id, data, options);
  }

  async exists(query) {
    return User.exists(query);
  }

  async findMany(query) {
    return User.find(query);
  }

  async findManyWithoutPassword(query) {
    return User.find(query).select("-password");
  }
}

export default new UserRepository();
