const DAY_INDEX = new Map([
  ['SUN', 0],
  ['MON', 1],
  ['TUE', 2],
  ['WED', 3],
  ['THU', 4],
  ['FRI', 5],
  ['SAT', 6],
])

const baseFareStrategies = {
  distance(config, journey) {
    const distanceKm = Number(journey.distanceKm)
    if (!Number.isFinite(distanceKm) || distanceKm < 0) {
      throw new TypeError('Journey distance must be a non-negative number.')
    }

    const band = (config.distanceFare || []).find((fare) => (
      isActive(fare) &&
      distanceKm >= Number(fare.minimumKm) &&
      distanceKm <= Number(fare.maximumKm)
    ))
    if (!band) throw new Error(`No active distance fare covers ${distanceKm} km.`)

    const rate = journey.distanceRate || 'standard'
    if (rate !== 'standard' && rate !== 'offPeak') {
      throw new TypeError('Distance rate must be "standard" or "offPeak".')
    }

    return {
      amount: Number(band[rate]),
      ruleId: band.id,
    }
  },
  flat(config, journey) {
    if (!journey.passengerType || !journey.serviceType) {
      throw new TypeError('Flat fares require a passenger type and service type.')
    }
    const fare = (config.flatFares || []).find((row) => (
      isActive(row) && String(row.label).toLowerCase() === String(journey.passengerType).toLowerCase()
    ))
    if (!fare) throw new Error(`No active flat fare exists for "${journey.passengerType}".`)

    const serviceType = String(journey.serviceType).toLowerCase()
    if (serviceType !== 'local' && serviceType !== 'express') {
      throw new TypeError('Flat fare service type must be "local" or "express".')
    }

    return {
      amount: Number(serviceType === 'local' ? fare.localFare : fare.expressFare),
      ruleId: fare.id,
    }
  },
}

export function calculateFare(config, journey) {
  if (!config || typeof config !== 'object') throw new TypeError('Fare configuration is required.')
  if (!journey || typeof journey !== 'object') throw new TypeError('Journey details are required.')

  const strategy = baseFareStrategies[journey.strategy]
  if (!strategy) throw new TypeError('Fare strategy must be "distance" or "flat".')

  const base = strategy(config, journey)
  assertFareAmount(base.amount, 'Base fare')
  const adjustment = findTimeAdjustment(config.timeFares || [], journey)
  const amountBeforeRounding = adjustment
    ? adjustment.type === 'multiplier'
      ? base.amount * adjustment.value
      : base.amount + adjustment.value
    : base.amount
  const totalFare = roundCurrency(amountBeforeRounding)
  if (totalFare < 0) throw new Error('The calculated fare cannot be negative.')

  return {
    strategy: journey.strategy,
    baseFare: roundCurrency(base.amount),
    timeAdjustment: roundCurrency(totalFare - roundCurrency(base.amount)),
    totalFare,
    currency: 'LKR',
    baseRuleId: base.ruleId,
    timeRuleId: adjustment?.ruleId ?? null,
  }
}

function findTimeAdjustment(timeFares, journey) {
  if (!journey.departureTime) return null
  const matchingFares = timeFares.filter((fare) => (
    isActive(fare) && isWithinWindow(journey.departureTime, fare.window) && appliesOnDate(fare.applies, journey.departureDate)
  ))
  if (matchingFares.length > 1) {
    throw new Error(`More than one active time fare matches ${journey.departureTime}.`)
  }
  if (!matchingFares.length) return null

  const fare = matchingFares[0]
  const multiplier = String(fare.rule).match(/^([+-]?\d+(?:\.\d+)?)\s*x$/i)
  if (multiplier) {
    const value = Number(multiplier[1])
    if (value < 0) throw new Error(`Time fare "${fare.period}" has an invalid negative multiplier.`)
    return { type: 'multiplier', value, ruleId: fare.id }
  }

  const surcharge = String(fare.rule).match(/^([+-])\s*(?:LKR\s*)?(\d+(?:\.\d+)?)$/i)
  if (surcharge) {
    return {
      type: 'surcharge',
      value: Number(surcharge[2]) * (surcharge[1] === '-' ? -1 : 1),
      ruleId: fare.id,
    }
  }
  throw new Error(`Time fare "${fare.period}" has an unsupported rule: ${fare.rule}.`)
}

function isWithinWindow(time, window) {
  const [start, end] = String(window).split(/\s*[–—-]\s*/)
  const startMinutes = parseTime(start, window)
  const endMinutes = parseTime(end, window)
  const timeMinutes = parseTime(time, time)
  return startMinutes <= endMinutes
    ? timeMinutes >= startMinutes && timeMinutes < endMinutes
    : timeMinutes >= startMinutes || timeMinutes < endMinutes
}

function parseTime(value, context) {
  const match = String(value).match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (!match) throw new Error(`Invalid time value "${context}". Expected HH:mm.`)
  return Number(match[1]) * 60 + Number(match[2])
}

function appliesOnDate(applies, departureDate) {
  const normalized = String(applies || 'ALL DAYS').toUpperCase().replace(/[–—]/g, '-').trim()
  if (normalized === 'ALL DAYS' || normalized === 'EVERY DAY') return true
  if (!departureDate) throw new TypeError('A departure date is required for weekday-based time fares.')

  const date = departureDate instanceof Date ? departureDate : new Date(`${departureDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) throw new TypeError('Departure date must be a valid date.')
  const weekday = date.getDay()
  const days = new Set()
  for (const part of normalized.split(',')) {
    const range = part.trim().match(/^([A-Z]{3})\s*-\s*([A-Z]{3})$/)
    if (range) {
      const first = DAY_INDEX.get(range[1])
      const last = DAY_INDEX.get(range[2])
      if (first === undefined || last === undefined) throw new Error(`Unsupported time-fare day range "${part}".`)
      for (let day = first; ; day = (day + 1) % 7) {
        days.add(day)
        if (day === last) break
      }
      continue
    }

    const day = DAY_INDEX.get(part.trim())
    if (day === undefined) throw new Error(`Unsupported time-fare day "${part}".`)
    days.add(day)
  }
  return days.has(weekday)
}

function isActive(fare) {
  return String(fare.status ?? 'Active').toLowerCase() === 'active'
}

function assertFareAmount(amount, label) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} must be a non-negative number.`)
}

function roundCurrency(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
