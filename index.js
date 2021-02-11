const config = require ('./config')
const ccxt = require ('ccxt')
const bitflyer = new ccxt.bitflyer (config)
const print = function(str) {
    let date = new Date();
    let time = date.toLocaleString()
    console.log("(" + MARKET_SYMBOL + ") " + "[" + time + "]  " + str)
}
const sleep = (timer) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, timer)
    })
}

const IS_TEST_MODE = true
const UPDATE_INVERVAL_SEC = 30
const ODER_SIZE_BTC = 0.01
const MARKET_SYMBOL = "FX_BTC_JPY"

var log = []
var position = null
var totalBenefit = 0

async function fetchValue() {
    const result = await bitflyer.fetchTicker(MARKET_SYMBOL)
    return result.last
}

async function createBuyOrder(size) {
    let currentPrice = log[2]
    let orderPrice = currentPrice * size
    if (!IS_TEST_MODE) {
        try {
            await bitflyer.createMarketBuyOrder(MARKET_SYMBOL, size);            
        } catch (error) {
            print(error)
            return      
        }
        position = orderPrice
    }
    print((IS_TEST_MODE ? "[TEST] " : "") + "🛍 Created Buy Order: " + orderPrice + "yen🥶")
    console.log(position)
}

async function createSellOrder(size) {
    let currentPrice = log[2]
    let orderPrice = currentPrice * size

    var sellOrder
    if (!IS_TEST_MODE) {
        sellOrder = await bitflyer.createMarketSellOrder(MARKET_SYMBOL, size);
    }

    // ORDEER REPORT
    let benefit = (orderPrice - position)
    totalBenefit += benefit
    print((IS_TEST_MODE ? "[TEST] " : "") + "💰 Created Sell Order: " + orderPrice + "yen🔥")
    console.log(sellOrder)

    // DIFF REPORT
    var icon = benefit > 0 ? "😆" : "🥵"
    print(icon + " diff: " + benefit + "yen " + icon)
    var totalIcon = totalBenefit > 0 ? "⭕" : "❌"
    print("📊 total: " + totalBenefit + "yen " + totalIcon)

    // CLEAR
    position = null
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

        if (position) {
            if (isUpTrend()) {
                await createSellOrder(ODER_SIZE_BTC)
            }    
        } else {
            if (isDownTrend()) {
                await createBuyOrder(ODER_SIZE_BTC)
            }    
        }

        await sleep(UPDATE_INVERVAL_SEC * 1000)
    }
}) ()