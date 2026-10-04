import * as scheduleRepository from '../repositories/scheduleRepository'

export function getSchedules() {
  return scheduleRepository.getSchedules()
}

export function getScheduleById(id) {
  return scheduleRepository.getScheduleById(id)
}

export function createSchedule(schedule) {
  return scheduleRepository.createSchedule(schedule)
}

export function updateSchedule(schedule) {
  return scheduleRepository.updateSchedule(schedule)
}

export function deleteSchedule(id) {
  return scheduleRepository.deleteSchedule(id)
}
