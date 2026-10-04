import * as routeRepository from '../repositories/routeRepository'

export function createRoute(route) {
  return routeRepository.createRoute(route)
}

export function updateRoute(route) {
  return routeRepository.updateRoute(route)
}

export function updateRouteStatus(id, status) {
  if (typeof status !== 'boolean') throw new TypeError('Route status must be a boolean.')
  return routeRepository.updateRouteStatus(id, status)
}

export function getRoutes() {
  return routeRepository.getRoutes()
}
