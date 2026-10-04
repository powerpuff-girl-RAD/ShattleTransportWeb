import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateFare } from '../src/services/fareStrategies.js'

const fareConfig = {
  distanceFare: [
    { id: 'short', minimumKm: 0, maximumKm: 10, standard: 100, offPeak: 80, status: 'Active' },
  ],
  flatFares: [
    { id: 'adult', label: 'Adult', localFare: 150, expressFare: 200, status: 'Active' },
  ],
  timeFares: [
    { id: 'weekday-peak', period: 'Peak', window: '07:00–09:00', applies: 'MON–FRI', rule: '1.5x', status: 'Active' },
    { id: 'night', period: 'Night', window: '22:00-05:00', applies: 'ALL DAYS', rule: '+ LKR 40', status: 'Active' },
  ],
}

test('distance strategy selects the requested active rate and applies a weekday multiplier', () => {
  assert.deepEqual(calculateFare(fareConfig, {
    strategy: 'distance',
    distanceKm: 6,
    distanceRate: 'standard',
    departureDate: '2026-10-05',
    departureTime: '08:00',
  }), {
    strategy: 'distance',
    baseFare: 100,
    timeAdjustment: 50,
    totalFare: 150,
    currency: 'LKR',
    baseRuleId: 'short',
    timeRuleId: 'weekday-peak',
  })
})

test('distance strategy applies a time-window surcharge across midnight', () => {
  const result = calculateFare(fareConfig, {
    strategy: 'distance',
    distanceKm: 6,
    distanceRate: 'offPeak',
    departureDate: '2026-10-04',
    departureTime: '23:15',
  })
  assert.equal(result.baseFare, 80)
  assert.equal(result.timeAdjustment, 40)
  assert.equal(result.totalFare, 120)
  assert.equal(result.timeRuleId, 'night')
})

test('flat strategy selects the passenger and service fare then applies matching time rule', () => {
  const result = calculateFare(fareConfig, {
    strategy: 'flat',
    passengerType: 'adult',
    serviceType: 'express',
    departureDate: '2026-10-05',
    departureTime: '08:00',
  })
  assert.equal(result.baseFare, 200)
  assert.equal(result.totalFare, 300)
})

test('throws when no active distance band covers the journey', () => {
  assert.throws(
    () => calculateFare(fareConfig, { strategy: 'distance', distanceKm: 12 }),
    /No active distance fare covers 12 km/,
  )
})

test('throws when active time rules overlap', () => {
  const overlappingConfig = {
    ...fareConfig,
    timeFares: [
      ...fareConfig.timeFares,
      { id: 'overlap', period: 'Other peak', window: '08:00-10:00', applies: 'MON–FRI', rule: '1.2x', status: 'Active' },
    ],
  }
  assert.throws(
    () => calculateFare(overlappingConfig, {
      strategy: 'distance',
      distanceKm: 6,
      departureDate: '2026-10-05',
      departureTime: '08:30',
    }),
    /More than one active time fare matches/,
  )
})
