const DB = require('./DbClient');
const config = require('./config');
const vkapi = new (require('./VKapi'))(config.USR_LOGIN,config.USR_PASSWD,config.token);
const DBClient = new DB(config.db_loc);
const Shell = new (require('./python_shell'))('predict.py');

Shell.predictor.on('message',function (msg) {
    vkapi.send(`${msg.data} баллов из 10`,msg.peer);
});

async function neuralNet(peer,follows,inputs) {
    let data = [];
    for(let i = 0; i< inputs.length;i++)
        data[i] = (follows.indexOf(inputs[i])!==-1)?1:0;
    Shell.predictor.send({
        peer: peer,
        data: data
    });
}

async function botPooling() {
    await DBClient.connect();
    await vkapi.authorize();
    let inputs = await DBClient.generateInputs(config.groups);
    vkapi.bot.on('command-notfound', msg => {
        vkapi.send('Я пока что не знаю таких команд(0((', msg.peer_id);
    });
    vkapi.bot.get(/\/me/i,msg => {
        vkapi.follows(msg.user_id).then(follows =>{
            neuralNet(msg.peer_id,follows,inputs).catch(e=> console.dir(e));
        });
    });
    vkapi.bot.get(/vk.com\/(\b)..*?\b/i, msg => {
        let link = msg.body.match(/vk.com\/(\b)..*?\b/i)[0];
        let name = link.match(/\b..*?\b/gi);
        name = name[name.length - 1];
        vkapi.userFollows(name).then(follows => {
            neuralNet(msg.peer_id,follows,inputs).catch(e=> console.dir(e));
        }).catch(e => {
            console.dir(e);
            vkapi.send('Не могу найти такого человека по ссылке!',msg.peer_id)
        });
    });
    vkapi.bot.get(/\/about/, msg => {
        vkapi.send(`Здесь должна быть информация о боте....`,msg.peer_id);
    });
    vkapi.bot.get(/Прив|Hi|Hello|Hey/i,msg => {
        vkapi.send(`Привет, я бот-ценитель
        Хочешь узнать обо мне - напиши \/about
        Хочешь, чтобы я тебя оценил - напиши \/me
        Хочешь, чтобы  я оценил кого-то другого - скинь мне его ссылку в вк
        Не обижайтесь, если ваше мнение не совпадает с моей оценкой `,msg.peer_id);
    });
    vkapi.bot.start();
}

botPooling().then();