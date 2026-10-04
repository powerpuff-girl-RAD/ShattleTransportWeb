import * as vehicleRepository from '../repositories/vehicleRepository'

export function getVehicles() {
  return vehicleRepository.getVehicles()
}

export function createVehicle(vehicle) {
  return vehicleRepository.createVehicle(vehicle)
}

export function updateVehicle(vehicle) {
  return vehicleRepository.updateVehicle(vehicle)
}

export function deleteVehicle(vehicleId) {
  return vehicleRepository.deleteVehicle(vehicleId)
}
