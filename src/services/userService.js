import * as userRepository from '../repositories/userRepository'

export function registerUserAccount(employee) {
  return userRepository.registerUserAccount(employee)
}

export function getUsers() {
  return userRepository.getUsers()
}

export function updateUserAccount(employee) {
  return userRepository.updateUserAccount(employee)
}

export function deleteUserAccount(id) {
  return userRepository.deleteUserAccount(id)
}
