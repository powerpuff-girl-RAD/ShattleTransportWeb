import * as fareRepository from '../repositories/fareRepository.js'

export { calculateFare } from './fareStrategies.js'

export async function getFareConfig(routeId) {
  return fareRepository.getFareConfig(routeId)
}

export async function updateFareConfig(config) {
  return fareRepository.updateFareConfig(config)
}
