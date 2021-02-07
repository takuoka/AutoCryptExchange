const config = require ('./config')
const ccxt = require ('ccxt')
const bitflyer = new ccxt.bitflyer (config)
const print = console.log
const sleep = (timer) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, timer)
    })
}

const IS_TEST_MODE = true
const UPDATE_INVERVAL_SEC = 10
const ODER_SIZE_BTC = 0.01

var log = []
var lastBuyOrder = null
var totalBenefit = 0

async function fetchValue() {
    const result = await bitflyer.fetchTicker('FX_BTC_JPY')
    return result.last
}

async function createBuyOrder(size) {
    if (IS_TEST_MODE) {
        lastBuyOrder = log[2] * ODER_SIZE_BTC
    } else {
        lastBuyOrder = await bitflyer.createMarketSellOrder("FX_BTC_JPY", size);
    }
    print((IS_TEST_MODE ? "[TEST] " : "") + "🛍 Created Buy Order: " + lastBuyOrder + "yen🥶")
}

async function createSellOrder(size) {
    var sellOrder
    if (IS_TEST_MODE) {
        sellOrder = log[2] * ODER_SIZE_BTC
    } else {
        sellOrder = await bitflyer.createMarketSellOrder("FX_BTC_JPY", size);
    }

    // ORDEER REPORT
    let benefit = (sellOrder - lastBuyOrder)
    totalBenefit += benefit
    print((IS_TEST_MODE ? "[TEST] " : "") + "💰 Created Sell Order: " + sellOrder + "yen🔥")

    // DIFF REPORT
    var icon = benefit > 0 ? "😆" : "🥵"
    print(icon + " diff: " + benefit + "yen " + icon)
    var totalIcon = totalBenefit > 0 ? "⭕" : "❌"
    print("📊 total: " + totalBenefit + "yen " + totalIcon)

    // CLEAR
    lastBuyOrder = null
}

async function updateLog() {
    var value = await fetchValue()
    log.push(value)
    if (log.length > 3) {
        log.shift()
    }
    print(value + " yen " + (isUp() ? "🔼" : "🔻") + "  (orderSize: " + ODER_SIZE_BTC * value + "yen)")
}

function isDownTrend() {
    return log[2] < log[1] && log[1] < log[0]
}

function isUpTrend() {
    return log[2] > log[1] && log[1] > log[0]
}

function isUp() {
    return log[2] > log[1]
}

// INFINITY LOOP
(async function () {
    print("========== START LOOP!! ==========")
    while(true) {

        await updateLog()

        if (lastBuyOrder) {
            if (isUpTrend()) {
                await createSellOrder()
            }    
        } else {
            if (isDownTrend()) {
                await createBuyOrder()
            }    
        }

        await sleep(UPDATE_INVERVAL_SEC * 1000)
    }
}) ()