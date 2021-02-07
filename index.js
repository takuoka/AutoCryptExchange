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
const UPDATE_INVERVAL_SEC = 30
const ODER_SIZE_BTC = 0.01;

var log = []
var lastBuyOrder = null
var totalBenefit = 0

async function fetchValue() {
    const result = await bitflyer.fetchTicker('FX_BTC_JPY')
    return result.last
}

async function createSellOrder(size) {
    var sellOrder
    if (IS_TEST_MODE) {
        sellOrder = log[2]
    } else {
        sellOrder = await bitflyer.createMarketSellOrder("FX_BTC_JPY", size);
    }

    let benefit = (sellOrder - lastBuyOrder) * ODER_SIZE_BTC
    totalBenefit += benefit
    print((IS_TEST_MODE ? "[TEST] " : "") + "💰 Created Sell Order: " + sellOrder)
    print("😆 benefit: " + benefit + "yen   totalBenefit: " + totalBenefit + "yen")

    lastBuyOrder = null
}

async function createBuyOrder(size) {
    if (IS_TEST_MODE) {
        lastBuyOrder = log[2]
    } else {
        lastBuyOrder = await bitflyer.createMarketSellOrder("FX_BTC_JPY", size);
    }
    print((IS_TEST_MODE ? "[TEST] " : "") + "🛍 Created Buy Order: " + lastBuyOrder)
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