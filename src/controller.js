const {generator} = require("./generator");
const math = require("mathjs");

const fs = require("fs");
const configFileName = './gameConfig.json';
const config = require(configFileName);
const playerDataFileName = './player_data.json';
const playerData = require(playerDataFileName);

class Controller {
    constructor(guild) {
        this.guild = guild;
        this.gameOn = false;

        if (!config[guild]) {
            config[guild] = {"limit": 100, "timeLimit": 30000, "tolerance": 0.1};
            fs.writeFile(configFileName, JSON.stringify(config), function writeJSON(err) {
                if (err) return console.log(err);
            });
        }
        if (!playerData[guild]) {
            playerData[guild] = {};
            fs.writeFile(playerDataFileName, JSON.stringify(playerData), function writeJSON(err) {
                if (err) return console.log(err);
            });
        }
    }

    fetchPlayerPoints() {
        return playerData[this.guild];
    }

    fetchConfig() {
        return JSON.stringify(config[this.guild]);
    }

    updateConfig(key, value) {
        if (typeof(config[this.guild][key]) == typeof(value) && value >= 0 && value <= 60000) {
            config[this.guild][key] = value;
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
        [this.target, this.comps] = generator(config[this.controller.guild].limit);
        this.rankings = {};
        this.finishCallback = null;
        this.finalRanks = [];
        this.expressions = [];

        setTimeout(this.finishGame.bind(this), config[this.controller.guild].timeLimit);
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
        expr = expr.replace(/\s/g, "");
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
        this.expressions.push(expr.replace(/\s/g, ""));

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
            if (d > config[this.controller.guild].tolerance * config[this.controller.guild].limit) {
                break;
            }
            this.finalRanks.push(...ranks[d].sort((a, b) => {
                return a.time - b.time;
            }));
        }

        this.controller.gameOn = false;

        for (let i = 0; i < this.finalRanks.length; ++i) {
            if (i >= 3) {break;}


            if (playerData[this.controller.guild][this.finalRanks[i].ID]) {
                playerData[this.controller.guild][this.finalRanks[i].ID] += 5 - i * 2;
            } else {
                playerData[this.controller.guild][this.finalRanks[i].ID] = 5 - i * 2;
            }
        }

        fs.writeFile(playerDataFileName, JSON.stringify(playerData), function writeJSON(err) {
            if (err) return console.log(err);
        });

        if(this.finishCallback) {
            this.finishCallback();
        }
    }
}

exports.Controller = Controller;