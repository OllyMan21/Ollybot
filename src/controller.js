const {generator} = require("./generator");
const config = require("./gameConfig.json");
const math = require("mathjs");
const { exp } = require("mathjs");

class Controller {
    constructor() {
        this.gameOn = false;
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
        this.gameOn = true;
        this.controller = controller;
        [this.target, this.comps] = generator(config.limit)
        this.rankings = {};
        this.finishCallback = null;
        this.finalRanks = [];

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
                return false;
            }
            nums.splice(nums.indexOf(Number(num)), 1);
        }

        return true;
    }

    submitAns(ID, time, expr) {
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
            this.finalRanks.push(...ranks[d].sort((a, b) => {
                return a.time - b.time;
            }));
        }

        this.controller.gameOn = false;
        this.gameOn = false;

        if(this.finishCallback) {
            this.finishCallback();
        }
    }
}

exports.Controller = Controller;