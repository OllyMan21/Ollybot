const {generator} = require("./generator");
const math = require("mathjs");

const fs = require("fs");
const configFileName = './gameConfig.json';
const config = require(configFileName);
const playerDataFileName = './player_data.json';
const playerData = require(playerDataFileName);

class Controller {
    constructor() {
        this.gameOn = false;
    }

    updateConfig(key, value) {
        console.log(key, value);
        if (typeof(config[key]) == typeof(value) && value >= 0) {
            config[key] = value;
            fs.writeFile(configFileName, JSON.stringify(config), function writeJSON(err) {
                if (err) return console.log(err);
            });
        } else {
            return false;
        }
        return true;
    }

    startGame() {
        if (this.gameOn) {
            return false;
        }
        this.gameOn = true;
        let game = new Game(this);
        return game;
    }
}

class Game {
    constructor(controller) {
        this.controller = controller;
        [this.target, this.comps] = generator(config.limit)
        this.rankings = {};
        this.finishCallback = null;
        this.finalRanks = [];
        this.expressions = [];

        setTimeout(this.finishGame.bind(this), config.timeLimit);
    }

    checkExpr(expr) {
        if (/[a-zA-Z]/.test(expr)) {
            return false;
        }
        try {
            math.evaluate(expr);
        } 
        catch (e) {
            return false;
        }
        return true;
    }

    checkAns(expr) {
        let nums = this.comps.slice();
        for (let num of expr.match(/\d+/g)) {
            if (!nums.includes(Number(num))) {
                return {status: 1};
            }
            nums.splice(nums.indexOf(Number(num)), 1);
        }
        if (this.expressions.includes(expr)) {
            return {status: 2};
        }

        return {status: 0};
    }

    submitAns(ID, time, expr) {
        this.expressions.push(expr);

        const exprEval = math.evaluate(expr);
        const diff = Math.abs(this.target - math.evaluate(exprEval));
        if (this.rankings[ID]) {
            if (diff < this.rankings[ID].diff) {
                this.rankings[ID].diff = diff;
                this.rankings[ID].time = time;
            }
        } else {
            this.rankings[ID] = {diff: diff, time: time};
        }

        return [exprEval, diff];
    }

    finishGame() {
        let ranks = {};
        for (let key in this.rankings) {
            let stats = this.rankings[key];
            if (ranks[stats.diff]) {
                ranks[stats.diff].push({ID: key, time: stats.time});
            } else {
                ranks[stats.diff] = [{ID: key, time: stats.time}];
            }
        }

        let sortedDiffs = Object.keys(ranks).sort((a, b) => {
            return a - b;
        });

        for (let d of sortedDiffs) {
            if (d > config.tolerance * config.limit) {
                break;
            }
            this.finalRanks.push(...ranks[d].sort((a, b) => {
                return a.time - b.time;
            }));
        }

        this.controller.gameOn = false;

        if(this.finishCallback) {
            this.finishCallback();
        }

        for (let i = 0; i < this.finalRanks.length; ++i) {
            if (i >= 3) {break;}


            if (playerData[this.finalRanks[i].ID]) {
                playerData[this.finalRanks[i].ID] += 5 - i * 2;
            } else {
                playerData[this.finalRanks[i].ID] = 5 - i * 2;
            }
        }

        fs.writeFile(playerDataFileName, JSON.stringify(playerData), function writeJSON(err) {
            if (err) return console.log(err);
        });
    }
}

exports.Controller = Controller;