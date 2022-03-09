// Require the necessary discord.js classes
const DiscordJS = require('discord.js');
const { token } = require('./config.json');
const { Controller } = require('./controller');

// Create a new client instance
const client = new DiscordJS.Client({ intents: [DiscordJS.Intents.FLAGS.GUILDS, DiscordJS.Intents.FLAGS.GUILD_MESSAGES] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

const controllers = {};

client.on("messageCreate", (message) => {
    let controller;
    if (controllers[message.guild.id]) {
        controller = controllers[message.guild.id]
    } else {
        controller = new Controller(message.guild.id);
        controllers[message.guild.id] = controller;
    }

    if (message.content.toLowerCase().slice(0, ".ollybot config".length) == ".ollybot config") {
        let command = message.content.toLowerCase().slice(".ollybot config".length, message.content.length);
        if (command.trim().length == 0) {
            message.reply(controller.fetchConfig());
        } else if (command.includes("time limit")) {
            let val = Number(command.slice(command.lastIndexOf("time limit") + "time limit".length, command.length));
            if (val) {
                controller.updateConfig("timeLimit", val * 1000);
            } else {
                message.reply("Invalid value!");
            }
        } else if (command.includes("limit")) {
            let val = Number(command.slice(command.lastIndexOf("limit") + "limit".length, command.length));
            if (val) {
                controller.updateConfig("limit", val);
            } else {
                message.reply("Invalid value!");
            }
        } else if (command.includes("tolerance")) {
            let val = Number(command.slice(command.lastIndexOf("tolerance") + "tolerance".length, command.length));
            if (val) {
                controller.updateConfig("tolerance", val);
            } else {
                message.reply("Invalid value!");
            }
        } else {
            message.reply("Unknown command!");
        }
    }

    if (message.content.toLowerCase() == ".ollybot go") {
        const game = controller.startGame();
        if (!game) {
            message.reply("Game already running!");
            return;
        } else {
            message.channel.send(`Try to create ${game.target} using the numbers ${game.comps}`);
        }

        const filter = m => game.checkExpr(m.content);
        const collector = message.channel.createMessageCollector({filter});

        game.finishCallback = () => {
            collector.stop();

            let playerPoints = controller.fetchPlayerPoints();
            let str = "Game ended!\n\n";
            for (let i = 0; i < game.finalRanks.length; ++i) {
                str += `${i + 1}. ${client.users.cache.find(user => user.id == game.finalRanks[i].ID)}\tPoints: ${playerPoints[game.finalRanks[i].ID]}`;
                if (i < game.finalRanks.length - 1) {
                    str += "\n";
                }
            }
            message.channel.send(str);

            return;
        }

        collector.on("collect", (m) => {
            let status = game.checkAns(m.content).status;
            switch(status) {
                case 0:
                    const [exprEval, diff] = game.submitAns(m.author.id, m.createdTimestamp, m.content);
                    m.reply(`\`\`\`Result: ${exprEval}\nDifference: ${diff}\`\`\``);
                    break;
                case 1:
                    m.reply("You either used a number that is not in the list or too many of the same number(s)!");
                    break;
                case 2:
                    m.reply("That expression has already been used!");
            }
        });
    }
});

// Login to Discord with your client's token
client.login(token);