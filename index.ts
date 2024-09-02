import { JSDOM } from 'jsdom'

// Parameters

const minChaosValue = 30
const minValue = 3000

// Dust values

const response = await fetch('https://poedb.tw/us/Kingsmarch#Disenchant')
const document = new JSDOM(await response.text()).window.document
const dustValues = Array.from(
  document.querySelectorAll(' div#Disenchant table tbody tr')
).reduce((dustValues, row) => ({
  ...dustValues,
  [row.querySelector('td a').innerHTML]: parseFloat(
    row.querySelector('td:last-child').innerHTML
  ),
}))

// Chaos values

type Item = {
  name: string
  chaosValue: number
  links?: number
  [key: string]: unknown
}

const loadItems = async (url: string): Promise<Item[]> =>
  (await (await fetch(url)).json()).lines
const chaosValues: Record<string, number> = [
  ...(await loadItems(
    'https://poe.ninja/api/data/itemoverview?league=Settlers&type=UniqueAccessory'
  )),
  ...(await loadItems(
    'https://poe.ninja/api/data/itemoverview?league=Settlers&type=UniqueWeapon'
  )),
  ...(await loadItems(
    'https://poe.ninja/api/data/itemoverview?league=Settlers&type=UniqueArmour'
  )),
]
  .filter(({ links, chaosValue }) => !links && chaosValue > minChaosValue)
  .reduce(
    (chaosValues, item) => ({
      ...chaosValues,
      [item.name]: item.chaosValue,
    }),
    {}
  )

// Combine dust and chaos values

Object.keys(dustValues)
  .map((name) => ({
    name,
    chaosValue: chaosValues[name] ?? 0,
    value: !chaosValues[name] ? 0 : dustValues[name] / chaosValues[name],
  }))
  .filter(({ value }) => value > minValue)
  .sort(({ value: value1 }, { value: value2 }) => value2 - value1)
  .forEach(({ name, chaosValue, value }) =>
    console.log(value.toFixed(), name, `${chaosValue}c`)
  )
