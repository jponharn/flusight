import * as utils from './utils'

// Selected items
export const metadata = state => state.metadata
export const seasons = (state, getters) => {
  return state.data[getters['switches/selectedRegion']].seasons.map(s => s.id)
}
export const regions = state => state.data.map(d => d.subId)
export const models = (state, getters) => {
  return state.data[getters['switches/selectedRegion']]
    .seasons[getters['switches/selectedSeason']]
    .models.map(m => m.id)
}
export const choropleths = state => ['Actual Weighted ILI (%)', 'Relative Weighted ILI (%)']

export const timeChart = state => state.timeChart
export const choropleth = state => state.choropleth

/**
 * Return observed data for currently selected state
 */
export const observed = (state, getters) => {
  let regionSubset = state.data[getters['switches/selectedRegion']]
  return regionSubset.seasons[getters['switches/selectedSeason']].actual
}

/**
 * Return actual data for currently selected state
 */
export const actual = (state, getters) => {
  let regionSubset = state.data[getters['switches/selectedRegion']]
  let seasonSubset = regionSubset.seasons[getters['switches/selectedSeason']]

  return utils.getMaxLagData(seasonSubset.actual)
}

/**
 * Return historical data for selected state
 * All data older than currently selected season
 */
export const history = (state, getters) => {
  let regionSubset = state.data[getters['switches/selectedRegion']]
  let currentSeasonId = getters['switches/selectedSeason']
  let weeksCount = regionSubset.seasons[currentSeasonId].actual.length

  let historicalData = []

  // Add data from history store
  for (let season of Object.keys(regionSubset.history)) {
    historicalData.push({
      id: season,
      actual: utils.trimHistory(regionSubset.history[season], weeksCount)
    })
  }

  for (let i = 0; i < currentSeasonId; i++) {
    historicalData.push({
      id: regionSubset.seasons[i].id,
      actual: utils.trimHistory(utils.getMaxLagData(regionSubset.seasons[i].actual),
                                weeksCount)
    })
  }

  return historicalData
}

/**
 * Baseline for selected state
 */
export const baseline = (state, getters) => {
  let regionSubset = state.data[getters['switches/selectedRegion']]
  return regionSubset.seasons[getters['switches/selectedSeason']].baseline
}

/**
 * All the model predictions for current state
 */
export const modelPreds = (state, getters) => {
  let regionSubset = state.data[getters['switches/selectedRegion']]
  return regionSubset.seasons[getters['switches/selectedSeason']].models
}

/**
 * Return data subset for chart as specified in region/season selected
 */
export const timeChartData = (state, getters) => {
  let regionSubset = state.data[getters['switches/selectedRegion']]

  return {
    region: regionSubset.subId, // Submission ids for displaying text
    observed: getters.observed,
    actual: getters.actual,
    baseline: getters.baseline,
    models: getters.modelPreds,
    history: getters.history
  }
}

/**
 * Return actual data for all regions for current selections
 */
export const choroplethData = (state, getters) => {
  let seasonId = getters['switches/selectedSeason']
  let relative = getters['switches/choroplethRelative']

  let output = {
    data: [],
    type: relative ? 'diverging' : 'sequential',
    decorator: relative ? x => x + ' % (baseline)' : x => x + ' %'
  }

  state.data.map(r => {
    let values = utils.getMaxLagData(r.seasons[seasonId].actual)

    if (relative) values = utils.baselineScale(values, r.seasons[seasonId].baseline)

    output.data.push({
      region: r.subId,
      states: r.states,
      value: values
    })
  })

  output.data = output.data.slice(1) // Remove national data

  output.range = utils.choroplethDataRange(state, getters)
  return output
}

/**
 * Return stats related to models
 */
export const modelStats = (state, getters) => {
  let actual = getters.actual
  let modelPreds = getters.modelPreds

  return {
    name: 'Mean Absolute Error',
    data: modelPreds.map(m => {
      return {
        id: m.id,
        value: utils.maeStats(m.predictions, actual)
      }
    })
  }
}